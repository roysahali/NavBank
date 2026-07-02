import random
import string
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import (
    DepositRequest,
    TransactionOut,
    TransferRequest,
    WithdrawRequest,
)
from app.services.notifications import fmt_amount, notify

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _gen_reference(mode: str) -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"{mode.upper()}{datetime.now().strftime('%Y%m%d')}{suffix}"


@router.get("", response_model=list[TransactionOut])
def get_my_transactions(
    skip: int = 0,
    limit: int = 50,
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    transfer_mode: Optional[str] = Query(None),
    transaction_type: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    if not all_accounts:
        return []

    if account_id:
        account_ids = [a.id for a in all_accounts if a.id == account_id]
        if not account_ids:
            return []
    else:
        account_ids = [a.id for a in all_accounts]

    q = (
        db.query(Transaction)
        .filter(
            (Transaction.from_account_id.in_(account_ids))
            | (Transaction.to_account_id.in_(account_ids))
        )
    )

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
            q = q.filter(Transaction.created_at >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc)
            q = q.filter(Transaction.created_at <= dt_to)
        except ValueError:
            pass

    if category:
        q = q.filter(Transaction.category == category)

    if transfer_mode:
        q = q.filter(Transaction.transfer_mode == transfer_mode)

    if transaction_type:
        q = q.filter(Transaction.transaction_type == transaction_type)

    txns = q.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    return txns


@router.post("/transfer", response_model=TransactionOut)
def transfer(
    data: TransferRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from_account = db.query(Account).filter(
        Account.id == data.from_account_id, Account.user_id == current_user.id
    ).first()
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found")
    if from_account.status != "active":
        raise HTTPException(status_code=400, detail="Source account is frozen")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if from_account.balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    to_account = db.query(Account).filter(
        Account.account_number == data.to_account_number
    ).first()
    if not to_account:
        raise HTTPException(status_code=404, detail="Destination account not found")
    if to_account.status != "active":
        raise HTTPException(status_code=400, detail="Destination account is frozen")
    if to_account.id == from_account.id:
        raise HTTPException(status_code=400, detail="Cannot transfer to the same account")

    transfer_mode = data.transfer_mode.upper() if data.transfer_mode else "IMPS"
    reference_number = _gen_reference(transfer_mode)

    from_account.balance -= data.amount
    to_account.balance += data.amount

    txn = Transaction(
        from_account_id=from_account.id,
        to_account_id=to_account.id,
        amount=data.amount,
        transaction_type="transfer",
        transfer_mode=transfer_mode,
        reference_number=reference_number,
        category="transfer",
        beneficiary_name=data.beneficiary_name or None,
        beneficiary_account=data.to_account_number,
        ifsc_code=data.to_ifsc,
        status="completed",
        description=data.description or f"Transfer to {data.to_account_number}",
    )
    db.add(txn)

    # Notify sender
    notify(
        db,
        current_user.id,
        "Debit Alert",
        f"{fmt_amount(data.amount)} sent to {data.to_account_number} via {transfer_mode}. "
        f"Ref: {reference_number}.",
        type="alert",
        related_url="/transactions",
    )
    # Notify receiver if their account belongs to a NovBank user
    if to_account.user_id:
        sender_name = current_user.full_name
        notify(
            db,
            to_account.user_id,
            "Credit Alert",
            f"{fmt_amount(data.amount)} received from {sender_name} via {transfer_mode}. "
            f"Ref: {reference_number}.",
            type="success",
            related_url="/transactions",
        )

    db.commit()
    db.refresh(txn)
    return txn


@router.post("/deposit", response_model=TransactionOut)
def deposit(
    data: DepositRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == data.account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.status != "active":
        raise HTTPException(status_code=400, detail="Account is frozen")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    account.balance += data.amount
    txn = Transaction(
        to_account_id=account.id,
        amount=data.amount,
        transaction_type="deposit",
        status="completed",
        description=data.description or "Self deposit",
    )
    db.add(txn)
    notify(
        db,
        current_user.id,
        "Amount Credited",
        f"{fmt_amount(data.amount)} has been deposited to your account.",
        type="success",
        related_url="/transactions",
    )
    db.commit()
    db.refresh(txn)
    return txn


@router.post("/withdraw", response_model=TransactionOut)
def withdraw(
    data: WithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == data.account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.status != "active":
        raise HTTPException(status_code=400, detail="Account is frozen")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if account.balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    account.balance -= data.amount
    txn = Transaction(
        from_account_id=account.id,
        amount=data.amount,
        transaction_type="withdrawal",
        transfer_mode="ATM",
        status="completed",
        description=data.description or "Withdrawal",
    )
    db.add(txn)
    notify(
        db,
        current_user.id,
        "Debit Alert",
        f"{fmt_amount(data.amount)} has been withdrawn from your account.",
        type="alert",
        related_url="/transactions",
    )
    db.commit()
    db.refresh(txn)
    return txn
