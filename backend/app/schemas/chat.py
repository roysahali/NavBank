from datetime import datetime
from pydantic import BaseModel


class ChatMessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionOut(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": False}


class ChatSessionDetail(ChatSessionOut):
    messages: list[ChatMessageOut] = []


class SendMessageRequest(BaseModel):
    content: str
