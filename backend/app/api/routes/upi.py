import random
import re
import string
from datetime import datetime
from typing import Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.upi import UpiTransaction, UpiVpa
from app.models.user import User
from app.schemas.upi import UpiPayRequest, UpiResolveOut, UpiTransactionOut, UpiVpaCreate, UpiVpaOut
from app.services.notifications import fmt_amount, notify

router = APIRouter(prefix="/upi", tags=["upi"])


def _mobile_from_vpa(vpa: str) -> Optional[str]:
    """Extract a 10-digit mobile number from VPAs like 9876543210@upi / 9876543210@ybl."""
    match = re.match(r'^(\d{10})@', vpa)
    return match.group(1) if match else None


def _resolve_receiver(vpa: str, db: Session) -> Tuple[Optional[UpiVpa], Optional[User], Optional[Account]]:
    """
    Returns (vpa_record, receiver_user, receiver_account).
    Tries registered VPA first, then mobile-number lookup.
    """
    vpa_record = db.query(UpiVpa).filter(
        UpiVpa.vpa == vpa,
        UpiVpa.is_active == True,  # noqa: E712
    ).first()
    if vpa_record:
        account = db.query(Account).filter(Account.id == vpa_record.linked_account_id).first()
        return vpa_record, vpa_record.user, account

    # Mobile-number based VPA: e.g. 9876543210@upi
    mobile = _mobile_from_vpa(vpa)
    if mobile:
        receiver_user = db.query(User).filter(User.mobile == mobile, User.is_active == True).first()  # noqa: E712
        if receiver_user:
            account = (
                db.query(Account)
                .filter(Account.user_id == receiver_user.id, Account.status == "active")
                .order_by(Account.id)
                .first()
            )
            return None, receiver_user, account

    return None, None, None


def _gen_upi_reference() -> str:
    suffix = "".join(random.choices(string.digits, k=12))
    return f"UPI{datetime.now().strftime('%Y%m%d')}{suffix}"


@router.get("/vpas", response_model=list[UpiVpaOut])
def list_vpas(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(UpiVpa)
        .filter(UpiVpa.user_id == current_user.id, UpiVpa.is_active == True)  # noqa: E712
        .all()
    )


@router.post("/vpas", response_model=UpiVpaOut, status_code=201)
def create_vpa(
    data: UpiVpaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(UpiVpa).filter(UpiVpa.vpa == data.vpa).first()
    if existing:
        raise HTTPException(status_code=400, detail="VPA already registered")

    account = db.query(Account).filter(
        Account.id == data.linked_account_id,
        Account.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # First VPA for user is primary
    existing_user_vpas = db.query(UpiVpa).filter(
        UpiVpa.user_id == current_user.id, UpiVpa.is_active == True  # noqa: E712
    ).count()
    is_primary = existing_user_vpas == 0

    vpa = UpiVpa(
        user_id=current_user.id,
        vpa=data.vpa,
        linked_account_id=data.linked_account_id,
        is_primary=is_primary,
    )
    db.add(vpa)
    db.commit()
    db.refresh(vpa)
    return vpa


@router.delete("/vpas/{vpa_id}")
def deactivate_vpa(
    vpa_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vpa = db.query(UpiVpa).filter(
        UpiVpa.id == vpa_id,
        UpiVpa.user_id == current_user.id,
    ).first()
    if not vpa:
        raise HTTPException(status_code=404, detail="VPA not found")

    vpa.is_active = False
    db.commit()
    return {"message": "VPA deactivated"}


@router.post("/pay", response_model=UpiTransactionOut)
def upi_pay(
    data: UpiPayRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Find sender VPA and verify it belongs to current user
    sender_vpa = db.query(UpiVpa).filter(
        UpiVpa.vpa == data.sender_vpa,
        UpiVpa.user_id == current_user.id,
        UpiVpa.is_active == True,  # noqa: E712
    ).first()
    if not sender_vpa:
        raise HTTPException(status_code=404, detail="Sender VPA not found or not owned by you")

    sender_account = db.query(Account).filter(Account.id == sender_vpa.linked_account_id).first()
    if not sender_account:
        raise HTTPException(status_code=404, detail="Sender linked account not found")
    if sender_account.status != "active":
        raise HTTPException(status_code=400, detail="Sender account is frozen")
    if sender_account.balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Find receiver — registered VPA or mobile-number based
    receiver_vpa, receiver_user, receiver_account = _resolve_receiver(data.receiver_vpa, db)
    if not receiver_user:
        raise HTTPException(status_code=404, detail="Receiver VPA not found")
    if not receiver_account:
        raise HTTPException(status_code=404, detail="Receiver has no active account")
    if receiver_account.status != "active":
        raise HTTPException(status_code=400, detail="Receiver account is frozen")

    if sender_account.id == receiver_account.id:
        raise HTTPException(status_code=400, detail="Cannot pay yourself")

    # Debit sender, credit receiver
    sender_account.balance -= data.amount
    receiver_account.balance += data.amount

    upi_ref = _gen_upi_reference()

    # Create debit transaction for sender
    debit_txn = Transaction(
        from_account_id=sender_account.id,
        to_account_id=receiver_account.id,
        amount=data.amount,
        transaction_type="transfer",
        transfer_mode="UPI",
        reference_number=upi_ref,
        category="transfer",
        beneficiary_name=receiver_user.full_name if receiver_user else None,
        status="completed",
        description=data.note or f"UPI payment to {data.receiver_vpa}",
    )
    db.add(debit_txn)
    db.flush()

    upi_txn = UpiTransaction(
        sender_vpa=data.sender_vpa,
        receiver_vpa=data.receiver_vpa,
        amount=data.amount,
        note=data.note,
        upi_reference=upi_ref,
        status="success",
        transaction_id=debit_txn.id,
    )
    db.add(upi_txn)

    # Notify sender
    notify(
        db,
        current_user.id,
        "UPI Debit Alert",
        f"{fmt_amount(data.amount)} paid to {data.receiver_vpa} via UPI. Ref: {upi_ref}.",
        type="alert",
        related_url="/upi",
    )
    # Notify receiver
    notify(
        db,
        receiver_user.id,
        "UPI Credit Alert",
        f"{fmt_amount(data.amount)} received from {data.sender_vpa} via UPI. Ref: {upi_ref}.",
        type="success",
        related_url="/upi",
    )

    db.commit()
    db.refresh(upi_txn)
    return upi_txn


@router.get("/transactions", response_model=list[UpiTransactionOut])
def list_upi_transactions(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_vpas = [
        v.vpa for v in db.query(UpiVpa).filter(UpiVpa.user_id == current_user.id).all()
    ]
    if not user_vpas:
        return []

    txns = (
        db.query(UpiTransaction)
        .filter(
            (UpiTransaction.sender_vpa.in_(user_vpas))
            | (UpiTransaction.receiver_vpa.in_(user_vpas))
        )
        .order_by(UpiTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return txns


@router.get("/resolve/{vpa}", response_model=UpiResolveOut)
def resolve_vpa(
    vpa: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _, receiver_user, _ = _resolve_receiver(vpa, db)
    if not receiver_user:
        raise HTTPException(status_code=404, detail="VPA not found")
    return UpiResolveOut(vpa=vpa, name=receiver_user.full_name)
