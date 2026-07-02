from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TransferRequest(BaseModel):
    from_account_id: int
    to_account_number: str
    to_ifsc: str = "NOVB0001001"
    beneficiary_name: str = ""
    amount: float
    description: str = ""
    transfer_mode: str = "IMPS"  # NEFT | RTGS | IMPS


class DepositRequest(BaseModel):
    account_id: int
    amount: float
    description: str = ""


class WithdrawRequest(BaseModel):
    account_id: int
    amount: float
    description: str = ""


class TransactionOut(BaseModel):
    id: int
    from_account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    amount: float
    transaction_type: str
    transfer_mode: Optional[str] = None
    category: Optional[str] = None
    reference_number: Optional[str] = None
    beneficiary_name: Optional[str] = None
    status: str
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminStats(BaseModel):
    total_users: int
    total_accounts: int
    total_balance: float
    total_transactions: int
    total_cards: int = 0
    total_loans: int = 0
