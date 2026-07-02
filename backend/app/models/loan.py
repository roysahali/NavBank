from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    loan_type: Mapped[str] = mapped_column(String)  # home | personal | auto
    loan_number: Mapped[str] = mapped_column(String, unique=True, index=True)
    principal_amount: Mapped[float] = mapped_column(Float)
    outstanding_amount: Mapped[float] = mapped_column(Float)
    interest_rate: Mapped[float] = mapped_column(Float)
    tenure_months: Mapped[int] = mapped_column(Integer)
    emi_amount: Mapped[float] = mapped_column(Float)
    disbursed_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    next_due_date: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="active")  # active | closed | overdue
    purpose: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    linked_account_id: Mapped[int] = mapped_column(Integer, ForeignKey("accounts.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="loans")
    linked_account = relationship("Account", back_populates="loans")
    emi_payments = relationship("EmiPayment", back_populates="loan", lazy="select")


class EmiPayment(Base):
    __tablename__ = "emi_payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    loan_id: Mapped[int] = mapped_column(Integer, ForeignKey("loans.id"), index=True)
    installment_number: Mapped[int] = mapped_column(Integer)
    amount_paid: Mapped[float] = mapped_column(Float)
    payment_date: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="paid")  # paid | overdue
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    loan = relationship("Loan", back_populates="emi_payments")
