from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.loan import EmiPayment, Loan
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.loan import EmiScheduleItem, LoanOut, PayEmiRequest
from app.services.notifications import fmt_amount, notify

router = APIRouter(prefix="/loans", tags=["loans"])


def _generate_emi_schedule(loan: Loan, count: int = 12) -> list[EmiScheduleItem]:
    """Generate future EMI schedule from next_due_date."""
    schedule = []
    try:
        next_due = date.fromisoformat(loan.next_due_date)
    except (ValueError, TypeError):
        next_due = date.today()

    monthly_rate = loan.interest_rate / 100 / 12
    outstanding = loan.outstanding_amount

    for i in range(count):
        due_date = next_due + timedelta(days=30 * i)
        if outstanding <= 0:
            break
        interest = round(outstanding * monthly_rate, 2)
        principal = round(min(loan.emi_amount - interest, outstanding), 2)
        outstanding = round(outstanding - principal, 2)
        schedule.append(
            EmiScheduleItem(
                installment_number=i + 1,
                due_date=due_date.isoformat(),
                emi_amount=loan.emi_amount,
                principal=principal,
                interest=interest,
                outstanding_after=max(outstanding, 0.0),
                status="upcoming",
            )
        )
    return schedule


@router.get("", response_model=list[LoanOut])
def list_loans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Loan).filter(Loan.user_id == current_user.id).all()


@router.get("/{loan_id}", response_model=LoanOut)
def get_loan(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(
        Loan.id == loan_id,
        Loan.user_id == current_user.id,
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@router.get("/{loan_id}/emi-schedule", response_model=list[EmiScheduleItem])
def get_emi_schedule(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(
        Loan.id == loan_id,
        Loan.user_id == current_user.id,
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return _generate_emi_schedule(loan, count=12)


@router.post("/{loan_id}/pay-emi")
def pay_emi(
    loan_id: int,
    data: PayEmiRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(
        Loan.id == loan_id,
        Loan.user_id == current_user.id,
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.status == "closed":
        raise HTTPException(status_code=400, detail="Loan is already closed")

    account = db.query(Account).filter(
        Account.id == data.from_account_id,
        Account.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.status != "active":
        raise HTTPException(status_code=400, detail="Account is frozen")
    if account.balance < loan.emi_amount:
        raise HTTPException(status_code=400, detail="Insufficient balance for EMI payment")

    emi_count = db.query(EmiPayment).filter(EmiPayment.loan_id == loan.id).count()

    monthly_rate = loan.interest_rate / 100 / 12
    interest_portion = round(loan.outstanding_amount * monthly_rate, 2)
    principal_portion = round(max(0.0, loan.emi_amount - interest_portion), 2)

    account.balance -= loan.emi_amount
    loan.outstanding_amount = max(0.0, round(loan.outstanding_amount - principal_portion, 2))

    payment_date = date.today()
    emi_payment = EmiPayment(
        loan_id=loan.id,
        installment_number=emi_count + 1,
        amount_paid=loan.emi_amount,
        payment_date=payment_date.isoformat(),
        status="paid",
    )
    db.add(emi_payment)

    # Update next due date (add 30 days)
    try:
        current_due = date.fromisoformat(loan.next_due_date)
        loan.next_due_date = (current_due + timedelta(days=30)).isoformat()
    except (ValueError, TypeError):
        loan.next_due_date = (payment_date + timedelta(days=30)).isoformat()

    if loan.outstanding_amount <= 0:
        loan.status = "closed"
        loan.outstanding_amount = 0.0

    # Record bank transaction
    txn = Transaction(
        from_account_id=account.id,
        amount=loan.emi_amount,
        transaction_type="transfer",
        transfer_mode="INTERNAL",
        category="other",
        status="completed",
        description=f"EMI payment - {loan.loan_number}",
    )
    db.add(txn)

    loan_closed = loan.status == "closed"
    notify(
        db,
        current_user.id,
        "Loan Closed" if loan_closed else "EMI Payment Successful",
        (
            f"{fmt_amount(loan.emi_amount)} EMI paid for loan {loan.loan_number}. "
            f"Your loan is now fully repaid. Congratulations!"
        ) if loan_closed else (
            f"{fmt_amount(loan.emi_amount)} EMI paid for loan {loan.loan_number}. "
            f"Outstanding: {fmt_amount(loan.outstanding_amount)}."
        ),
        type="success",
        related_url="/loans",
    )
    db.commit()

    return {
        "message": "EMI paid successfully",
        "installment_number": emi_count + 1,
        "amount_paid": loan.emi_amount,
        "outstanding_amount": loan.outstanding_amount,
        "loan_status": loan.status,
    }
