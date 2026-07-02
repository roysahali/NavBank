from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CreditCard(Base):
    __tablename__ = "credit_cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    card_number: Mapped[str] = mapped_column(String, unique=True, index=True)  # masked
    card_type: Mapped[str] = mapped_column(String)  # VISA | MASTERCARD | RUPAY
    card_variant: Mapped[str] = mapped_column(String)  # Platinum | Gold | Classic
    credit_limit: Mapped[float] = mapped_column(Float)
    outstanding_amount: Mapped[float] = mapped_column(Float, default=0.0)
    available_limit: Mapped[float] = mapped_column(Float)
    billing_date: Mapped[int] = mapped_column(Integer)
    due_date_day: Mapped[int] = mapped_column(Integer)
    minimum_due: Mapped[float] = mapped_column(Float, default=0.0)
    reward_points: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="active")  # active | blocked | expired
    cvv: Mapped[str] = mapped_column(String, default="000")
    expiry_month: Mapped[int] = mapped_column(Integer)
    expiry_year: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="credit_cards")
    transactions = relationship("CreditCardTransaction", back_populates="card", lazy="select")


class CreditCardTransaction(Base):
    __tablename__ = "cc_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    card_id: Mapped[int] = mapped_column(Integer, ForeignKey("credit_cards.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    merchant_name: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    transaction_type: Mapped[str] = mapped_column(String)  # purchase | payment | refund | cashback
    status: Mapped[str] = mapped_column(String, default="posted")  # posted | pending
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    card = relationship("CreditCard", back_populates="transactions")
