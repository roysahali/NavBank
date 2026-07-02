from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LoanOut(BaseModel):
    id: int
    user_id: int
    loan_type: str
    loan_number: str
    principal_amount: float
    outstanding_amount: float
    interest_rate: float
    tenure_months: int
    emi_amount: float
    disbursed_date: Optional[str] = None
    next_due_date: str
    status: str
    purpose: Optional[str] = None
    linked_account_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class EmiScheduleItem(BaseModel):
    installment_number: int
    due_date: str
    emi_amount: float
    principal: float
    interest: float
    outstanding_after: float
    status: str  # upcoming | paid | overdue


class PayEmiRequest(BaseModel):
    from_account_id: int
