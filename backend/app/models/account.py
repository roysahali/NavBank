from __future__ import annotations

import random
import string
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _gen_account_number() -> str:
    return "ACC" + "".join(random.choices(string.digits, k=10))


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    account_number: Mapped[str] = mapped_column(
        String, unique=True, index=True, default=_gen_account_number
    )
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    account_type: Mapped[str] = mapped_column(String, default="savings")  # savings | current
    balance: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String, default="active")  # active | frozen | closed
    ifsc_code: Mapped[str] = mapped_column(String, default="NOVB0001001")
    branch_name: Mapped[str] = mapped_column(String, default="Mumbai Main Branch")
    interest_rate: Mapped[float] = mapped_column(Float, default=3.5)
    nominee_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    owner = relationship("User", back_populates="accounts")
    outgoing = relationship(
        "Transaction", foreign_keys="Transaction.from_account_id", back_populates="from_account"
    )
    incoming = relationship(
        "Transaction", foreign_keys="Transaction.to_account_id", back_populates="to_account"
    )
    upi_vpas = relationship("UpiVpa", back_populates="linked_account", lazy="select")
    loans = relationship("Loan", back_populates="linked_account", lazy="select")
    deposit_requests = relationship("DepositRequest", back_populates="account", lazy="select")
