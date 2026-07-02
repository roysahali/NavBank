from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_id: Mapped[int] = mapped_column(Integer, ForeignKey("accounts.id"), nullable=False)
    loan_type: Mapped[str] = mapped_column(String(20), nullable=False)   # personal | home | auto
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    tenure_months: Mapped[int] = mapped_column(Integer, nullable=False)
    purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    monthly_income: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending | approved | rejected
    admin_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    loan_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("loans.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="loan_applications")  # type: ignore[name-defined]
    account: Mapped["Account"] = relationship("Account", foreign_keys=[account_id])  # type: ignore[name-defined]
    reviewer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reviewed_by])  # type: ignore[name-defined]
    loan: Mapped[Optional["Loan"]] = relationship("Loan", foreign_keys=[loan_id])  # type: ignore[name-defined]
