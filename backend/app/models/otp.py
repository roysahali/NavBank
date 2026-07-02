from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OtpSession(Base):
    __tablename__ = "otp_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mobile: Mapped[str] = mapped_column(String, index=True)
    otp_code: Mapped[str] = mapped_column(String)
    purpose: Mapped[str] = mapped_column(String, default="login")  # login | transfer
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
