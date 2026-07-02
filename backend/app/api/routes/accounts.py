from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.account import AccountOut
from app.schemas.transaction import TransactionOut

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountOut])
def get_my_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Account).filter(Account.user_id == current_user.id).all()


@router.get("/{account_id}", response_model=AccountOut)
def get_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.get("/{account_id}/transactions", response_model=list[TransactionOut])
def get_account_transactions(
    account_id: int,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    txns = (
        db.query(Transaction)
        .filter(
            (Transaction.from_account_id == account_id)
            | (Transaction.to_account_id == account_id)
        )
        .order_by(Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return txns


@router.get("/{account_id}/mini-statement", response_model=list[TransactionOut])
def get_mini_statement(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    txns = (
        db.query(Transaction)
        .filter(
            (Transaction.from_account_id == account_id)
            | (Transaction.to_account_id == account_id)
        )
        .order_by(Transaction.created_at.desc())
        .limit(10)
        .all()
    )
    return txns
