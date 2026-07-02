import random
import string
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.core.security import hash_password
from app.database import get_db
from app.models.account import Account
from app.models.credit_card import CreditCard
from app.models.deposit_request import DepositRequest
from app.models.loan import Loan
from app.models.loan_application import LoanApplication
from app.models.notification import Notification
from app.models.transaction import Transaction
from app.models.upi import UpiTransaction, UpiVpa
from app.models.user import User
from app.schemas.account import AccountWithOwner, AdminAccountCreate, AdminDeposit
from app.schemas.credit_card import AdminIssueCard, CreditCardOut
from app.schemas.loan import LoanOut
from app.schemas.transaction import AdminStats, TransactionOut
from app.schemas.user import AdminCreateUser, AdminUpdateUser, UserOut
from app.services.audit import log_audit
from app.services.notifications import fmt_amount, notify

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total_users = db.query(User).filter(User.role == "customer").count()
    total_accounts = db.query(Account).count()
    total_balance = db.query(Account).with_entities(Account.balance).all()
    total_transactions = db.query(Transaction).count()
    total_cards = db.query(CreditCard).count()
    total_loans = db.query(Loan).count()
    return AdminStats(
        total_users=total_users,
        total_accounts=total_accounts,
        total_balance=sum(r[0] for r in total_balance),
        total_transactions=total_transactions,
        total_cards=total_cards,
        total_loans=total_loans,
    )


@router.get("/users", response_model=list[UserOut])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return db.query(User).offset(skip).limit(limit).all()


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(
    data: AdminCreateUser,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.mobile == data.mobile).first():
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        mobile=data.mobile,
        role=data.role,
        kyc_status=data.kyc_status,
    )
    db.add(user)
    db.flush()
    if data.create_account:
        account = Account(user_id=user.id, account_type="savings", balance=0.0)
        db.add(account)
    log_audit(db, current_admin.id, "create_user", entity_type="user", entity_id=user.id,
              summary=f"Created user {user.email} (role: {user.role})")
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: AdminUpdateUser,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin" and current_admin.id != user.id:
        raise HTTPException(status_code=400, detail="Cannot edit other admin accounts")
    if data.email and data.email != user.email:
        if db.query(User).filter(User.email == data.email, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email
    if data.mobile and data.mobile != user.mobile:
        if db.query(User).filter(User.mobile == data.mobile, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="Mobile already in use")
        user.mobile = data.mobile
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.kyc_status is not None:
        user.kyc_status = data.kyc_status
    if data.password:
        user.hashed_password = hash_password(data.password)
    log_audit(db, current_admin.id, "update_user", entity_type="user", entity_id=user_id,
              summary=f"Updated profile for {user.email}")
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin accounts")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    name = user.full_name
    email = user.email
    db.delete(user)
    log_audit(db, current_admin.id, "delete_user", entity_type="user", entity_id=user_id,
              summary=f"Deleted user {email} ({name})")
    db.commit()
    return {"message": f"User {name} deleted successfully"}


@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot disable admin accounts")
    user.is_active = not user.is_active
    action = "activate_user" if user.is_active else "deactivate_user"
    log_audit(db, current_admin.id, action, entity_type="user", entity_id=user_id,
              summary=f"{'Activated' if user.is_active else 'Deactivated'} user {user.email}")
    db.commit()
    db.refresh(user)
    return user


@router.get("/accounts", response_model=list[AccountWithOwner])
def list_accounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    accounts = db.query(Account).offset(skip).limit(limit).all()
    result = []
    for acc in accounts:
        result.append(
            AccountWithOwner(
                id=acc.id,
                account_number=acc.account_number,
                user_id=acc.user_id,
                owner_name=acc.owner.full_name,
                owner_email=acc.owner.email,
                account_type=acc.account_type,
                balance=acc.balance,
                status=acc.status,
                ifsc_code=acc.ifsc_code,
                branch_name=acc.branch_name,
                interest_rate=acc.interest_rate,
                created_at=acc.created_at,
            )
        )
    return result


@router.post("/accounts", response_model=AccountWithOwner)
def create_account(
    data: AdminAccountCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    account = Account(
        user_id=data.user_id,
        account_type=data.account_type,
        balance=data.initial_balance,
        ifsc_code=data.ifsc_code,
        branch_name=data.branch_name,
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    return AccountWithOwner(
        id=account.id,
        account_number=account.account_number,
        user_id=account.user_id,
        owner_name=user.full_name,
        owner_email=user.email,
        account_type=account.account_type,
        balance=account.balance,
        status=account.status,
        ifsc_code=account.ifsc_code,
        branch_name=account.branch_name,
        interest_rate=account.interest_rate,
        created_at=account.created_at,
    )


@router.patch("/accounts/{account_id}/freeze")
def freeze_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.status = "frozen"
    if account.user_id:
        notify(
            db,
            account.user_id,
            "Account Frozen",
            f"Your account ••••{account.account_number[-4:]} has been frozen by NovBank. "
            "All transactions on this account are suspended. "
            "Please contact your branch or call 1800-XXX-XXXX for assistance.",
            type="alert",
            related_url="/accounts",
        )
    log_audit(db, current_admin.id, "freeze_account", entity_type="account", entity_id=account_id,
              summary=f"Froze account {account.account_number}")
    db.commit()
    return {"message": "Account frozen"}


@router.patch("/accounts/{account_id}/unfreeze")
def unfreeze_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.status = "active"
    if account.user_id:
        notify(
            db,
            account.user_id,
            "Account Reactivated",
            f"Your account ••••{account.account_number[-4:]} has been reactivated. "
            "You can now perform transactions normally.",
            type="success",
            related_url="/accounts",
        )
    log_audit(db, current_admin.id, "unfreeze_account", entity_type="account", entity_id=account_id,
              summary=f"Unfroze account {account.account_number}")
    db.commit()
    return {"message": "Account unfrozen"}


@router.post("/deposit", response_model=TransactionOut)
def admin_deposit(
    data: AdminDeposit,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    account = db.query(Account).filter(Account.id == data.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    account.balance += data.amount
    txn = Transaction(
        to_account_id=account.id,
        amount=data.amount,
        transaction_type="deposit",
        status="completed",
        description=data.description,
    )
    db.add(txn)
    if account.user_id:
        notify(
            db,
            account.user_id,
            "Amount Credited",
            f"{fmt_amount(data.amount)} has been credited to your account "
            f"({account.account_number}) by NovBank.",
            type="success",
            related_url="/transactions",
        )
    log_audit(db, current_admin.id, "admin_deposit", entity_type="account", entity_id=data.account_id,
              summary=f"Deposited {fmt_amount(data.amount)} to account {account.account_number}")
    db.commit()
    db.refresh(txn)
    return txn


@router.get("/transactions", response_model=list[TransactionOut])
def list_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return (
        db.query(Transaction)
        .order_by(Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ── Loans ──────────────────────────────────────────────────────────────────

@router.get("/loans", response_model=list[LoanOut])
def list_all_loans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return db.query(Loan).order_by(Loan.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/loans/{loan_id}/status")
def update_loan_status(
    loan_id: int,
    status: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    allowed = {"active", "closed", "overdue"}
    if status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")
    loan.status = status
    db.commit()
    return {"message": f"Loan status updated to {status}"}


# ── Credit Cards ────────────────────────────────────────────────────────────

@router.get("/credit-cards", response_model=list[CreditCardOut])
def list_all_credit_cards(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return db.query(CreditCard).order_by(CreditCard.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/credit-cards", response_model=CreditCardOut, status_code=201)
def issue_credit_card(
    data: AdminIssueCard,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate full card number and CVV
    prefix_map = {"VISA": "4", "MASTERCARD": "5", "RUPAY": "6"}
    prefix = prefix_map.get(data.card_type.upper(), "4")
    digits = "".join(random.choices(string.digits, k=15))
    raw = (prefix + digits)[:16]
    card_number = f"{raw[0:4]} {raw[4:8]} {raw[8:12]} {raw[12:16]}"
    cvv = "".join(random.choices(string.digits, k=3))

    card = CreditCard(
        user_id=data.user_id,
        card_number=card_number,
        cvv=cvv,
        card_type=data.card_type.upper(),
        card_variant=data.card_variant,
        credit_limit=data.credit_limit,
        outstanding_amount=0.0,
        available_limit=data.credit_limit,
        billing_date=5,
        due_date_day=25,
        minimum_due=0.0,
        reward_points=0,
        status="active",
        expiry_month=data.expiry_month,
        expiry_year=data.expiry_year,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.patch("/credit-cards/{card_id}/block")
def block_credit_card(
    card_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    card = db.query(CreditCard).filter(CreditCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Credit card not found")
    card.status = "blocked"
    db.commit()
    return {"message": "Card blocked successfully"}


# ── Customer 360 / Full User Profile ───────────────────────────────────────

@router.get("/users/search")
def search_users(
    q: str = "",
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
) -> list[dict[str, Any]]:
    """Search customers by name, email, or mobile."""
    query = db.query(User).filter(User.role == "customer")
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                User.full_name.ilike(pattern),
                User.email.ilike(pattern),
                User.mobile.ilike(pattern),
            )
        )
    users = query.order_by(User.full_name).offset(skip).limit(limit).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "mobile": u.mobile,
            "kyc_status": u.kyc_status,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.get("/users/{user_id}/full-profile")
def get_user_full_profile(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
) -> dict[str, Any]:
    """Customer 360 — every piece of data the bank holds about a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Accounts
    accounts = db.query(Account).filter(Account.user_id == user_id).all()
    account_ids = [a.id for a in accounts]

    # Transactions across all accounts (last 100)
    transactions: list[Transaction] = []
    if account_ids:
        transactions = (
            db.query(Transaction)
            .filter(
                or_(
                    Transaction.from_account_id.in_(account_ids),
                    Transaction.to_account_id.in_(account_ids),
                )
            )
            .order_by(Transaction.created_at.desc())
            .limit(100)
            .all()
        )

    # UPI VPAs
    upi_vpas = db.query(UpiVpa).filter(UpiVpa.user_id == user_id).all()
    vpa_strings = [v.vpa for v in upi_vpas]

    # UPI transactions (last 50)
    upi_txns: list[UpiTransaction] = []
    if vpa_strings:
        upi_txns = (
            db.query(UpiTransaction)
            .filter(
                or_(
                    UpiTransaction.sender_vpa.in_(vpa_strings),
                    UpiTransaction.receiver_vpa.in_(vpa_strings),
                )
            )
            .order_by(UpiTransaction.created_at.desc())
            .limit(50)
            .all()
        )

    # Credit cards
    cards = db.query(CreditCard).filter(CreditCard.user_id == user_id).all()

    # Loans
    loans = db.query(Loan).filter(Loan.user_id == user_id).order_by(Loan.created_at.desc()).all()

    # Loan applications
    loan_apps = (
        db.query(LoanApplication)
        .filter(LoanApplication.user_id == user_id)
        .order_by(LoanApplication.created_at.desc())
        .all()
    )

    # Deposit requests (last 30)
    deposits = (
        db.query(DepositRequest)
        .filter(DepositRequest.user_id == user_id)
        .order_by(DepositRequest.created_at.desc())
        .limit(30)
        .all()
    )

    # Notifications (last 30)
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )

    def _ts(dt: datetime | None) -> str | None:
        return dt.isoformat() if dt else None

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "mobile": user.mobile,
            "role": user.role,
            "kyc_status": user.kyc_status,
            "is_active": user.is_active,
            "created_at": _ts(user.created_at),
        },
        "accounts": [
            {
                "id": a.id,
                "account_number": a.account_number,
                "account_type": a.account_type,
                "balance": a.balance,
                "status": a.status,
                "ifsc_code": a.ifsc_code,
                "branch_name": a.branch_name,
                "interest_rate": a.interest_rate,
                "created_at": _ts(a.created_at),
            }
            for a in accounts
        ],
        "transactions": [
            {
                "id": t.id,
                "transaction_type": t.transaction_type,
                "amount": t.amount,
                "status": t.status,
                "description": t.description,
                "from_account_id": t.from_account_id,
                "to_account_id": t.to_account_id,
                "created_at": _ts(t.created_at),
            }
            for t in transactions
        ],
        "upi_vpas": [
            {
                "id": v.id,
                "vpa": v.vpa,
                "linked_account_id": v.linked_account_id,
                "is_primary": v.is_primary,
                "created_at": _ts(v.created_at),
            }
            for v in upi_vpas
        ],
        "upi_transactions": [
            {
                "id": u.id,
                "sender_vpa": u.sender_vpa,
                "receiver_vpa": u.receiver_vpa,
                "amount": u.amount,
                "status": u.status,
                "note": u.note,
                "created_at": _ts(u.created_at),
            }
            for u in upi_txns
        ],
        "credit_cards": [
            {
                "id": c.id,
                "card_number": c.card_number,
                "card_type": c.card_type,
                "card_variant": c.card_variant,
                "credit_limit": c.credit_limit,
                "outstanding_amount": c.outstanding_amount,
                "available_limit": c.available_limit,
                "status": c.status,
                "expiry_month": c.expiry_month,
                "expiry_year": c.expiry_year,
                "reward_points": c.reward_points,
                "created_at": _ts(c.created_at),
            }
            for c in cards
        ],
        "loans": [
            {
                "id": ln.id,
                "loan_type": ln.loan_type,
                "principal_amount": ln.principal_amount,
                "outstanding_amount": ln.outstanding_amount,
                "interest_rate": ln.interest_rate,
                "tenure_months": ln.tenure_months,
                "emi_amount": ln.emi_amount,
                "status": ln.status,
                "created_at": _ts(ln.created_at),
            }
            for ln in loans
        ],
        "loan_applications": [
            {
                "id": la.id,
                "loan_type": la.loan_type,
                "amount": la.amount,
                "tenure_months": la.tenure_months,
                "purpose": la.purpose,
                "monthly_income": la.monthly_income,
                "status": la.status,
                "admin_note": la.admin_note,
                "created_at": _ts(la.created_at),
            }
            for la in loan_apps
        ],
        "deposit_requests": [
            {
                "id": d.id,
                "amount": d.amount,
                "status": d.status,
                "created_at": _ts(d.created_at),
            }
            for d in deposits
        ],
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": _ts(n.created_at),
            }
            for n in notifications
        ],
    }
