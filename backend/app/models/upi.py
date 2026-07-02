from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UpiVpa(Base):
    __tablename__ = "upi_vpas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    vpa: Mapped[str] = mapped_column(String, unique=True, index=True)
    linked_account_id: Mapped[int] = mapped_column(Integer, ForeignKey("accounts.id"))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="upi_vpas")
    linked_account = relationship("Account", back_populates="upi_vpas")


class UpiTransaction(Base):
    __tablename__ = "upi_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sender_vpa: Mapped[str] = mapped_column(String, index=True)
    receiver_vpa: Mapped[str] = mapped_column(String, index=True)
    amount: Mapped[float] = mapped_column(Float)
    note: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    upi_reference: Mapped[str] = mapped_column(String, unique=True, index=True)
    status: Mapped[str] = mapped_column(String, default="success")  # success | failed | pending
    transaction_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("transactions.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
