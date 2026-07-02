from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UpiVpaCreate(BaseModel):
    vpa: str
    linked_account_id: int


class UpiVpaOut(BaseModel):
    id: int
    vpa: str
    linked_account_id: int
    is_primary: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UpiPayRequest(BaseModel):
    sender_vpa: str
    receiver_vpa: str
    amount: float
    note: Optional[str] = None


class UpiTransactionOut(BaseModel):
    id: int
    sender_vpa: str
    receiver_vpa: str
    amount: float
    note: Optional[str] = None
    upi_reference: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UpiResolveOut(BaseModel):
    vpa: str
    name: str
