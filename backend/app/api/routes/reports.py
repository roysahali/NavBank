import csv
import io
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import decode_token
from app.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionOut
from jose import JWTError


def _get_user_from_token_param(token: str, db: Session) -> User:
    """Resolve a raw JWT string (from query param) to a User."""
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
    except JWTError:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()  # noqa: E712
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def get_csv_user(
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> User:
    """Auth for CSV download: accept token from query param or Authorization header."""
    if token:
        return _get_user_from_token_param(token, db)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return _get_user_from_token_param(auth_header[7:], db)
    raise HTTPException(status_code=401, detail="Not authenticated")

router = APIRouter(prefix="/reports", tags=["reports"])


def _get_filtered_transactions(
    current_user: User,
    db: Session,
    date_from: Optional[str],
    date_to: Optional[str],
    account_id: Optional[int],
    category: Optional[str],
    limit: int = 500,
) -> list:
    account_ids = [a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()]
    if not account_ids:
        return []

    if account_id and account_id in account_ids:
        filter_ids = [account_id]
    else:
        filter_ids = account_ids

    q = db.query(Transaction).filter(
        (Transaction.from_account_id.in_(filter_ids))
        | (Transaction.to_account_id.in_(filter_ids))
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

    return q.order_by(Transaction.created_at.desc()).limit(limit).all()


@router.get("/transactions", response_model=list[TransactionOut])
def report_transactions(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txns = _get_filtered_transactions(current_user, db, date_from, date_to, account_id, category)
    return txns


@router.get("/transactions/csv")
def report_transactions_csv(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_csv_user),
    db: Session = Depends(get_db),
):
    txns = _get_filtered_transactions(current_user, db, date_from, date_to, account_id, category)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Date", "Type", "Mode", "Reference", "Category",
        "Amount", "From Account", "To Account", "Beneficiary", "Status", "Description"
    ])

    for t in txns:
        writer.writerow([
            t.id,
            t.created_at.strftime("%Y-%m-%d %H:%M:%S") if t.created_at else "",
            t.transaction_type,
            t.transfer_mode or "",
            t.reference_number or "",
            t.category or "",
            t.amount,
            t.from_account_id or "",
            t.to_account_id or "",
            t.beneficiary_name or "",
            t.status,
            t.description,
        ])

    output.seek(0)
    filename = f"transactions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
