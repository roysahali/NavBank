from __future__ import annotations

import math
import random
import string
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.loan import Loan
from app.models.loan_application import LoanApplication
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.loan_application import AdminLoanReview, LoanApplicationCreate, LoanApplicationOut
from app.services.audit import log_audit
from app.services.notifications import fmt_amount, notify

router = APIRouter(prefix="/loan-applications", tags=["loan-applications"])

RATE_MAP = {
    "personal": 10.5,
    "home": 7.5,
    "auto": 8.9,
}


def _calc_emi(principal: float, annual_rate: float, months: int) -> float:
    r = annual_rate / 100 / 12
    if r == 0:
        return round(principal / months, 2)
    emi = principal * r * math.pow(1 + r, months) / (math.pow(1 + r, months) - 1)
    return round(emi, 2)


def _loan_number() -> str:
    return "LN" + "".join(random.choices(string.digits, k=10))


def _build_out(app: LoanApplication) -> LoanApplicationOut:
    rate = RATE_MAP.get(app.loan_type, 10.5)
    emi = _calc_emi(app.amount, rate, app.tenure_months)
    return LoanApplicationOut(
        id=app.id,
        user_id=app.user_id,
        account_id=app.account_id,
        loan_type=app.loan_type,
        amount=app.amount,
        tenure_months=app.tenure_months,
        purpose=app.purpose,
        monthly_income=app.monthly_income,
        status=app.status,
        admin_note=app.admin_note,
        reviewed_by=app.reviewed_by,
        loan_id=app.loan_id,
        created_at=app.created_at,
        updated_at=app.updated_at,
        user_name=app.user.full_name if app.user else None,
        user_email=app.user.email if app.user else None,
        account_number=app.account.account_number if app.account else None,
        interest_rate=rate,
        emi_amount=emi,
    )


# ── Customer ──────────────────────────────────────────────────────────────────

@router.post("", response_model=LoanApplicationOut, status_code=201)
def apply_for_loan(
    data: LoanApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.loan_type not in RATE_MAP:
        raise HTTPException(status_code=400, detail="Invalid loan type. Choose personal, home, or auto.")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Loan amount must be positive")
    if data.tenure_months <= 0:
        raise HTTPException(status_code=400, detail="Tenure must be positive")

    account = db.query(Account).filter(
        Account.id == data.account_id,
        Account.user_id == current_user.id,
        Account.status == "active",
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found or frozen")

    # Prevent duplicate pending applications for same type
    existing = db.query(LoanApplication).filter(
        LoanApplication.user_id == current_user.id,
        LoanApplication.loan_type == data.loan_type,
        LoanApplication.status == "pending",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending application for this loan type")

    app = LoanApplication(
        user_id=current_user.id,
        account_id=data.account_id,
        loan_type=data.loan_type,
        amount=data.amount,
        tenure_months=data.tenure_months,
        purpose=data.purpose,
        monthly_income=data.monthly_income,
        status="pending",
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    notify(
        db,
        current_user.id,
        "Loan Application Received",
        f"Your {data.loan_type.capitalize()} loan application for {fmt_amount(data.amount)} has been submitted. "
        "Our team will review it within 2 business days.",
        type="info",
        related_url="/loans",
    )
    db.commit()
    return _build_out(app)


@router.get("/my", response_model=list[LoanApplicationOut])
def my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    apps = (
        db.query(LoanApplication)
        .filter(LoanApplication.user_id == current_user.id)
        .order_by(LoanApplication.created_at.desc())
        .all()
    )
    return [_build_out(a) for a in apps]


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.get("/admin", response_model=list[LoanApplicationOut])
def admin_list(
    status: str = Query("all"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(LoanApplication)
    if status != "all":
        q = q.filter(LoanApplication.status == status)
    apps = q.order_by(LoanApplication.created_at.desc()).all()
    return [_build_out(a) for a in apps]


@router.patch("/admin/{app_id}/approve", response_model=LoanApplicationOut)
def admin_approve(
    app_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    app = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != "pending":
        raise HTTPException(status_code=400, detail=f"Application is already {app.status}")

    account = db.query(Account).filter(Account.id == app.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Disbursement account not found")

    rate = RATE_MAP.get(app.loan_type, 10.5)
    emi = _calc_emi(app.amount, rate, app.tenure_months)
    today = date.today()
    next_due = today + timedelta(days=30)

    # Create the Loan record
    loan = Loan(
        user_id=app.user_id,
        loan_type=app.loan_type,
        loan_number=_loan_number(),
        principal_amount=app.amount,
        outstanding_amount=app.amount,
        interest_rate=rate,
        tenure_months=app.tenure_months,
        emi_amount=emi,
        disbursed_date=today.isoformat(),
        next_due_date=next_due.isoformat(),
        status="active",
        purpose=app.purpose,
        linked_account_id=account.id,
    )
    db.add(loan)
    db.flush()  # get loan.id

    # Disburse amount to account
    account.balance += app.amount

    # Transaction record
    txn = Transaction(
        to_account_id=account.id,
        amount=app.amount,
        transaction_type="credit",
        transfer_mode="INTERNAL",
        category="transfer",
        status="completed",
        description=f"Loan disbursal – {loan.loan_number}",
    )
    db.add(txn)

    # Update application
    app.status = "approved"
    app.reviewed_by = current_admin.id
    app.loan_id = loan.id
    app.updated_at = datetime.now(timezone.utc)

    notify(
        db,
        app.user_id,
        "Loan Approved & Disbursed! 🎉",
        f"Your {app.loan_type.capitalize()} loan of {fmt_amount(app.amount)} has been approved. "
        f"{fmt_amount(app.amount)} has been credited to account ••••{account.account_number[-4:]}. "
        f"EMI of {fmt_amount(emi)}/month starts from {next_due.strftime('%d %b %Y')}.",
        type="success",
        related_url="/loans",
    )
    log_audit(
        db, current_admin.id, "approve_loan_application",
        entity_type="loan_application", entity_id=app_id,
        summary=f"Approved {app.loan_type} loan of {fmt_amount(app.amount)} for {app.user.full_name if app.user else 'user'}",
    )
    db.commit()
    db.refresh(app)
    return _build_out(app)


@router.patch("/admin/{app_id}/reject", response_model=LoanApplicationOut)
def admin_reject(
    app_id: int,
    data: AdminLoanReview,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    app = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != "pending":
        raise HTTPException(status_code=400, detail=f"Application is already {app.status}")

    app.status = "rejected"
    app.reviewed_by = current_admin.id
    app.admin_note = data.admin_note
    app.updated_at = datetime.now(timezone.utc)

    notify(
        db,
        app.user_id,
        "Loan Application Update",
        f"Your {app.loan_type.capitalize()} loan application for {fmt_amount(app.amount)} was not approved at this time."
        + (f" Reason: {data.admin_note}" if data.admin_note else " Please contact support for details."),
        type="alert",
        related_url="/loans",
    )
    log_audit(
        db, current_admin.id, "reject_loan_application",
        entity_type="loan_application", entity_id=app_id,
        summary=f"Rejected {app.loan_type} loan application of {fmt_amount(app.amount)} for {app.user.full_name if app.user else 'user'}",
    )
    db.commit()
    db.refresh(app)
    return _build_out(app)
