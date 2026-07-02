from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SupportMessageOut(BaseModel):
    id: int
    ticket_id: int
    sender_id: int
    sender_name: str  # computed field — populate manually in route
    message: str
    is_admin_reply: bool
    created_at: datetime
    model_config = {"from_attributes": False}  # manual construction


class SupportTicketCreate(BaseModel):
    subject: str
    category: str = "other"
    priority: str = "medium"
    message: str  # first message body


class SupportTicketOut(BaseModel):
    id: int
    user_id: int
    ticket_number: str
    subject: str
    category: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    model_config = {"from_attributes": False}


class SupportTicketDetail(SupportTicketOut):
    messages: list[SupportMessageOut] = []


class SupportReply(BaseModel):
    message: str


class UpdateTicketStatus(BaseModel):
    status: str  # open/in_progress/resolved/closed
