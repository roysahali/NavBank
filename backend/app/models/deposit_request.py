from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DepositRequest(Base):
    __tablename__ = "deposit_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    account_id: Mapped[int] = mapped_column(Integer, ForeignKey("accounts.id"))
    amount: Mapped[float] = mapped_column(Float)
    denominations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string: {"100":2,"200":1,"500":3}
    status: Mapped[str] = mapped_column(String, default="pending")  # pending | approved | rejected
    admin_note: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    reviewed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="deposit_requests")
    account = relationship("Account", back_populates="deposit_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
