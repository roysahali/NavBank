from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    from_account_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("accounts.id"), nullable=True
    )
    to_account_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("accounts.id"), nullable=True
    )
    amount: Mapped[float] = mapped_column(Float)
    transaction_type: Mapped[str] = mapped_column(String)  # deposit | withdrawal | transfer
    transfer_mode: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # NEFT/RTGS/IMPS/UPI/INTERNAL/ATM
    reference_number: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # food/utilities/rent/salary/shopping/healthcare/transfer/other
    beneficiary_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    beneficiary_account: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ifsc_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="completed")  # completed | failed
    description: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    from_account = relationship(
        "Account", foreign_keys=[from_account_id], back_populates="outgoing"
    )
    to_account = relationship(
        "Account", foreign_keys=[to_account_id], back_populates="incoming"
    )
