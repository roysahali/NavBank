from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BeneficiaryCreate(BaseModel):
    name: str
    account_number: str
    ifsc_code: str
    bank_name: str
    alias: Optional[str] = None


class BeneficiaryOut(BaseModel):
    id: int
    user_id: int
    name: str
    account_number: str
    ifsc_code: str
    bank_name: str
    alias: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
