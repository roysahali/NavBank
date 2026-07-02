from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class LoanApplicationCreate(BaseModel):
    loan_type: str       # personal | home | auto
    amount: float
    tenure_months: int
    purpose: str
    monthly_income: float
    account_id: int      # account to disburse loan into on approval


class LoanApplicationOut(BaseModel):
    id: int
    user_id: int
    account_id: int
    loan_type: str
    amount: float
    tenure_months: int
    purpose: Optional[str] = None
    monthly_income: float
    status: str
    admin_note: Optional[str] = None
    reviewed_by: Optional[int] = None
    loan_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Joined fields
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    account_number: Optional[str] = None
    interest_rate: Optional[float] = None
    emi_amount: Optional[float] = None

    model_config = {"from_attributes": True}


class AdminLoanReview(BaseModel):
    admin_note: Optional[str] = None
