from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    related_url: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    related_url: Optional[str] = None
