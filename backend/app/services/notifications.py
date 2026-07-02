from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification


def notify(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "info",
    related_url: Optional[str] = None,
) -> None:
    n = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        related_url=related_url,
    )
    db.add(n)


def fmt_amount(amount: float) -> str:
    return f"₹{amount:,.2f}"
