from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String)
    hashed_password: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="customer")  # customer | admin
    mobile: Mapped[str] = mapped_column(String, unique=True, index=True, default="")
    pan_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    kyc_status: Mapped[str] = mapped_column(String, default="verified")
    address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    accounts = relationship("Account", back_populates="owner", lazy="select", cascade="all, delete-orphan")
    beneficiaries = relationship("Beneficiary", back_populates="user", lazy="select", cascade="all, delete-orphan")
    upi_vpas = relationship("UpiVpa", back_populates="user", lazy="select", cascade="all, delete-orphan")
    credit_cards = relationship("CreditCard", back_populates="user", lazy="select", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="user", lazy="select", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", lazy="select", cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="user", lazy="select", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", lazy="select", cascade="all, delete-orphan")
    deposit_requests = relationship("DepositRequest", foreign_keys="DepositRequest.user_id", back_populates="user", lazy="select", cascade="all, delete-orphan")
    loan_applications = relationship("LoanApplication", foreign_keys="LoanApplication.user_id", back_populates="user", lazy="select", cascade="all, delete-orphan")
