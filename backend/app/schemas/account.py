from datetime import datetime

from pydantic import BaseModel


class AccountOut(BaseModel):
    id: int
    account_number: str
    user_id: int
    account_type: str
    balance: float
    status: str
    ifsc_code: str
    branch_name: str
    interest_rate: float
    created_at: datetime

    model_config = {"from_attributes": True}


class AccountWithOwner(BaseModel):
    id: int
    account_number: str
    user_id: int
    owner_name: str
    owner_email: str
    account_type: str
    balance: float
    status: str
    ifsc_code: str = "NOVB0001001"
    branch_name: str = "Mumbai Main Branch"
    interest_rate: float = 3.5
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminAccountCreate(BaseModel):
    user_id: int
    account_type: str = "savings"
    initial_balance: float = 0.0
    ifsc_code: str = "NOVB0001001"
    branch_name: str = "Mumbai Main Branch"


class AdminDeposit(BaseModel):
    account_id: int
    amount: float
    description: str = "Admin deposit"
