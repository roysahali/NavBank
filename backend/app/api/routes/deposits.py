from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.deposit_request import DepositRequest
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.deposit_request import AdminReviewRequest, DepositRequestCreate, DepositRequestOut
from app.services.audit import log_audit
from app.services.notifications import fmt_amount, notify

router = APIRouter(prefix="/deposits", tags=["deposits"])


def _build_out(req: DepositRequest) -> DepositRequestOut:
    return DepositRequestOut(
        id=req.id,
        user_id=req.user_id,
        account_id=req.account_id,
        amount=req.amount,
        denominations=req.denominations,
        status=req.status,
        admin_note=req.admin_note,
        reviewed_by=req.reviewed_by,
        created_at=req.created_at,
        updated_at=req.updated_at,
        user_name=req.user.full_name if req.user else None,
        user_email=req.user.email if req.user else None,
        account_number=req.account.account_number if req.account else None,
    )


# ── Customer endpoints ────────────────────────────────────────────────────────

@router.post("", response_model=DepositRequestOut, status_code=201)
def create_deposit_request(
    data: DepositRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == data.account_id,
        Account.user_id == current_user.id,
        Account.status == "active",
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found or frozen")

    d = data.denominations
    denom_map = {
        "100": d.notes_100,
        "200": d.notes_200,
        "500": d.notes_500,
    }
    total = (
        d.notes_100 * 100
        + d.notes_200 * 200
        + d.notes_500 * 500
    )
    if total <= 0:
        raise HTTPException(status_code=400, detail="Total deposit amount must be greater than zero")

    req = DepositRequest(
        user_id=current_user.id,
        account_id=data.account_id,
        amount=float(total),
        denominations=json.dumps(denom_map),
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    notify(
        db,
        current_user.id,
        "Deposit Request Submitted",
        f"Your cash deposit request for {fmt_amount(float(total))} is pending admin approval.",
        type="info",
        related_url="/accounts",
    )
    db.commit()

    return _build_out(req)


@router.get("/my", response_model=list[DepositRequestOut])
def get_my_deposit_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reqs = (
        db.query(DepositRequest)
        .filter(DepositRequest.user_id == current_user.id)
        .order_by(DepositRequest.created_at.desc())
        .all()
    )
    return [_build_out(r) for r in reqs]


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin", response_model=list[DepositRequestOut])
def admin_list_deposit_requests(
    status: str = "all",
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(DepositRequest)
    if status != "all":
        q = q.filter(DepositRequest.status == status)
    reqs = q.order_by(DepositRequest.created_at.desc()).all()
    return [_build_out(r) for r in reqs]


@router.patch("/admin/{request_id}/approve", response_model=DepositRequestOut)
def admin_approve_deposit(
    request_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    req = db.query(DepositRequest).filter(DepositRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Deposit request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    account = db.query(Account).filter(Account.id == req.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Credit the account
    account.balance += req.amount

    # Create transaction record
    txn = Transaction(
        to_account_id=account.id,
        amount=req.amount,
        transaction_type="deposit",
        transfer_mode="CASH",
        category="transfer",
        status="completed",
        description=f"Cash deposit approved by admin (Req #{req.id})",
    )
    db.add(txn)

    # Update request
    req.status = "approved"
    req.reviewed_by = current_admin.id
    req.updated_at = datetime.now(timezone.utc)

    notify(
        db,
        req.user_id,
        "Deposit Approved",
        f"Your cash deposit of {fmt_amount(req.amount)} has been approved and credited to account ••••{account.account_number[-4:]}.",
        type="success",
        related_url="/accounts",
    )
    log_audit(db, current_admin.id, "approve_deposit", entity_type="deposit_request", entity_id=req.id,
              summary=f"Approved cash deposit of {fmt_amount(req.amount)} for account ••••{account.account_number[-4:]}")

    db.commit()
    db.refresh(req)
    return _build_out(req)


@router.patch("/admin/{request_id}/reject", response_model=DepositRequestOut)
def admin_reject_deposit(
    request_id: int,
    data: AdminReviewRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    req = db.query(DepositRequest).filter(DepositRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Deposit request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    account = db.query(Account).filter(Account.id == req.account_id).first()

    req.status = "rejected"
    req.reviewed_by = current_admin.id
    req.admin_note = data.admin_note
    req.updated_at = datetime.now(timezone.utc)

    acct_suffix = f"••••{account.account_number[-4:]}" if account else ""
    notify(
        db,
        req.user_id,
        "Deposit Rejected",
        f"Your cash deposit request of {fmt_amount(req.amount)} for account {acct_suffix} was rejected."
        + (f" Reason: {data.admin_note}" if data.admin_note else ""),
        type="alert",
        related_url="/accounts",
    )
    log_audit(db, current_admin.id, "reject_deposit", entity_type="deposit_request", entity_id=req.id,
              summary=f"Rejected cash deposit of {fmt_amount(req.amount)} for account {acct_suffix}")

    db.commit()
    db.refresh(req)
    return _build_out(req)
