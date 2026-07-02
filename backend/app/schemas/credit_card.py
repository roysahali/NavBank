from datetime import datetime

from pydantic import BaseModel


class CreditCardOut(BaseModel):
    id: int
    user_id: int
    card_number: str
    card_type: str
    card_variant: str
    credit_limit: float
    outstanding_amount: float
    available_limit: float
    billing_date: int
    due_date_day: int
    minimum_due: float
    reward_points: int
    status: str
    cvv: str
    expiry_month: int
    expiry_year: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CreditCardTransactionOut(BaseModel):
    id: int
    card_id: int
    amount: float
    merchant_name: str
    category: str
    transaction_type: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PayBillRequest(BaseModel):
    amount: float
    from_account_id: int


class AdminIssueCard(BaseModel):
    user_id: int
    card_type: str  # VISA | MASTERCARD | RUPAY
    card_variant: str  # Platinum | Gold | Classic
    credit_limit: float
    expiry_month: int
    expiry_year: int
