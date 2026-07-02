import random
import string

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.credit_card import CreditCard, CreditCardTransaction
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.credit_card import CreditCardOut, CreditCardTransactionOut, PayBillRequest
from app.services.notifications import fmt_amount, notify

router = APIRouter(prefix="/credit-cards", tags=["credit-cards"])


@router.get("", response_model=list[CreditCardOut])
def list_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(CreditCard).filter(CreditCard.user_id == current_user.id).all()


@router.get("/{card_id}", response_model=CreditCardOut)
def get_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(CreditCard).filter(
        CreditCard.id == card_id,
        CreditCard.user_id == current_user.id,
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Credit card not found")
    return card


@router.get("/{card_id}/transactions", response_model=list[CreditCardTransactionOut])
def get_card_transactions(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(CreditCard).filter(
        CreditCard.id == card_id,
        CreditCard.user_id == current_user.id,
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Credit card not found")

    return (
        db.query(CreditCardTransaction)
        .filter(CreditCardTransaction.card_id == card_id)
        .order_by(CreditCardTransaction.created_at.desc())
        .limit(20)
        .all()
    )


@router.post("/{card_id}/pay-bill", response_model=CreditCardOut)
def pay_bill(
    card_id: int,
    data: PayBillRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(CreditCard).filter(
        CreditCard.id == card_id,
        CreditCard.user_id == current_user.id,
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Credit card not found")
    if card.status != "active":
        raise HTTPException(status_code=400, detail="Card is blocked or expired")

    account = db.query(Account).filter(
        Account.id == data.from_account_id,
        Account.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.status != "active":
        raise HTTPException(status_code=400, detail="Account is frozen")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if account.balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    payment_amount = min(data.amount, card.outstanding_amount)

    account.balance -= payment_amount
    card.outstanding_amount -= payment_amount
    card.available_limit = card.credit_limit - card.outstanding_amount
    if card.outstanding_amount <= 0:
        card.outstanding_amount = 0.0
        card.minimum_due = 0.0
        card.available_limit = card.credit_limit

    # Record transaction on the account
    ref = "CCPAY" + "".join(random.choices(string.digits, k=10))
    txn = Transaction(
        from_account_id=account.id,
        amount=payment_amount,
        transaction_type="transfer",
        transfer_mode="INTERNAL",
        reference_number=ref,
        category="other",
        status="completed",
        description=f"Credit card bill payment - {card.card_number}",
    )
    db.add(txn)

    # Record on card
    cc_txn = CreditCardTransaction(
        card_id=card.id,
        amount=payment_amount,
        merchant_name="NovBank",
        category="payment",
        transaction_type="payment",
        status="posted",
    )
    db.add(cc_txn)
    notify(
        db,
        current_user.id,
        "Credit Card Bill Paid",
        f"{fmt_amount(payment_amount)} paid towards card ending "
        f"{card.card_number[-4:]}. Outstanding: {fmt_amount(card.outstanding_amount)}.",
        type="success",
        related_url="/credit-cards",
    )
    db.commit()
    db.refresh(card)
    return card
