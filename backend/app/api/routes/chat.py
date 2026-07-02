from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.schemas.chat import (
    ChatMessageOut,
    ChatSessionDetail,
    ChatSessionOut,
    SendMessageRequest,
)
from app.services.ai_chat import get_ai_response

router = APIRouter(prefix="/chat", tags=["chat"])


def _session_to_out(session: ChatSession) -> ChatSessionOut:
    return ChatSessionOut(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(session.messages),
    )


def _session_to_detail(session: ChatSession) -> ChatSessionDetail:
    return ChatSessionDetail(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(session.messages),
        messages=[ChatMessageOut.model_validate(m) for m in session.messages],
    )


@router.post("/sessions", response_model=ChatSessionDetail, status_code=201)
def create_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = ChatSession(user_id=current_user.id, title="New Conversation")
    db.add(session)
    db.flush()

    # Welcome message
    greeting = (
        f"Hello {current_user.full_name.split()[0]}! 👋 I'm **Nova**, your NovBank AI assistant. "
        f"I have access to your live account data and can help with:\n\n"
        f"• 💰 Account balances & statements\n"
        f"• 📊 Transaction history & spending insights\n"
        f"• 🏠 Loan details & EMI schedule\n"
        f"• 💳 Credit card info & bill payment\n"
        f"• 🔄 Transfer guidance (NEFT/RTGS/IMPS/UPI)\n"
        f"• 🧮 EMI & interest calculations\n\n"
        f"What can I help you with today?"
    )
    welcome = ChatMessage(session_id=session.id, role="assistant", content=greeting)
    db.add(welcome)
    db.commit()
    db.refresh(session)
    return _session_to_detail(session)


@router.get("/sessions", response_model=list[ChatSessionOut])
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .limit(20)
        .all()
    )
    return [_session_to_out(s) for s in sessions]


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _session_to_detail(session)


@router.post("/sessions/{session_id}/message", response_model=ChatMessageOut)
def send_message(
    session_id: int,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    user_msg = ChatMessage(session_id=session.id, role="user", content=body.content)
    db.add(user_msg)
    db.flush()

    # Auto-title session from first user message
    if len(session.messages) == 2:  # welcome + first user msg
        session.title = body.content[:60] + ("…" if len(body.content) > 60 else "")

    # Build conversation history for AI
    history = [{"role": m.role, "content": m.content} for m in session.messages[:-1]]

    # Get AI response
    ai_text = get_ai_response(current_user, db, history, body.content)

    ai_msg = ChatMessage(session_id=session.id, role="assistant", content=ai_text)
    db.add(ai_msg)
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ai_msg)
    return ChatMessageOut.model_validate(ai_msg)


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
