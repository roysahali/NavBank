from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, field_validator


class DenominationCreate(BaseModel):
    notes_100: int = 0
    notes_200: int = 0
    notes_500: int = 0


class DepositRequestCreate(BaseModel):
    account_id: int
    denominations: DenominationCreate


class DepositRequestOut(BaseModel):
    id: int
    user_id: int
    account_id: int
    amount: float
    denominations: Optional[Any] = None
    status: str
    admin_note: Optional[str] = None
    reviewed_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Joined fields
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    account_number: Optional[str] = None

    @field_validator("denominations", mode="before")
    @classmethod
    def parse_denominations(cls, v: Any) -> Any:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return v

    model_config = {"from_attributes": True}


class AdminReviewRequest(BaseModel):
    admin_note: Optional[str] = None
