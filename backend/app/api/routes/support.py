from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_current_user
from app.database import get_db
from app.models.notification import Notification
from app.models.support import SupportMessage, SupportTicket
from app.schemas.support import (
    SupportMessageOut,
    SupportReply,
    SupportTicketCreate,
    SupportTicketDetail,
    SupportTicketOut,
    UpdateTicketStatus,
)

router = APIRouter(prefix="/support", tags=["support"])


def _build_ticket_out(ticket: SupportTicket) -> SupportTicketOut:
    return SupportTicketOut(
        id=ticket.id,
        user_id=ticket.user_id,
        ticket_number=ticket.ticket_number,
        subject=ticket.subject,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        message_count=len(ticket.messages),
    )


def _build_ticket_detail(ticket: SupportTicket) -> SupportTicketDetail:
    msgs = [
        SupportMessageOut(
            id=m.id,
            ticket_id=m.ticket_id,
            sender_id=m.sender_id,
            sender_name=m.sender.full_name,
            message=m.message,
            is_admin_reply=m.is_admin_reply,
            created_at=m.created_at,
        )
        for m in ticket.messages
    ]
    return SupportTicketDetail(
        id=ticket.id,
        user_id=ticket.user_id,
        ticket_number=ticket.ticket_number,
        subject=ticket.subject,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        message_count=len(msgs),
        messages=msgs,
    )


# ── Customer Endpoints ─────────────────────────────────────────────────────────

@router.post("", response_model=SupportTicketDetail, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: SupportTicketCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new support ticket with an initial message."""
    ticket_number = f"TKT-{str(db.query(SupportTicket).count() + 1).zfill(5)}"
    ticket = SupportTicket(
        user_id=current_user.id,
        ticket_number=ticket_number,
        subject=payload.subject,
        category=payload.category,
        priority=payload.priority,
    )
    db.add(ticket)
    db.flush()

    first_message = SupportMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=payload.message,
        is_admin_reply=False,
    )
    db.add(first_message)
    db.commit()
    db.refresh(ticket)
    return _build_ticket_detail(ticket)


@router.get("", response_model=list[SupportTicketOut])
def list_my_tickets(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List current user's support tickets ordered by updated_at desc."""
    tickets = (
        db.query(SupportTicket)
        .filter(SupportTicket.user_id == current_user.id)
        .order_by(SupportTicket.updated_at.desc())
        .all()
    )
    return [_build_ticket_out(t) for t in tickets]


@router.get("/{ticket_id}", response_model=SupportTicketDetail)
def get_ticket(
    ticket_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a support ticket with all messages."""
    ticket = (
        db.query(SupportTicket)
        .filter(SupportTicket.id == ticket_id, SupportTicket.user_id == current_user.id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return _build_ticket_detail(ticket)


@router.post("/{ticket_id}/reply", response_model=SupportMessageOut, status_code=status.HTTP_201_CREATED)
def reply_to_ticket(
    ticket_id: int,
    payload: SupportReply,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Customer posts a reply to a support ticket."""
    ticket = (
        db.query(SupportTicket)
        .filter(SupportTicket.id == ticket_id, SupportTicket.user_id == current_user.id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    if ticket.status == "closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reply to a closed ticket",
        )

    msg = SupportMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=payload.message,
        is_admin_reply=False,
    )
    db.add(msg)

    ticket.updated_at = datetime.now(timezone.utc)
    # If ticket was resolved, reopen it since customer replied
    if ticket.status == "resolved":
        ticket.status = "open"

    db.commit()
    db.refresh(msg)

    return SupportMessageOut(
        id=msg.id,
        ticket_id=msg.ticket_id,
        sender_id=msg.sender_id,
        sender_name=current_user.full_name,
        message=msg.message,
        is_admin_reply=msg.is_admin_reply,
        created_at=msg.created_at,
    )


# ── Admin Endpoints ────────────────────────────────────────────────────────────

@router.get("/admin/tickets/{ticket_id}", response_model=SupportTicketDetail)
def admin_get_ticket(
    ticket_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get any ticket with all messages (admin only)."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return _build_ticket_detail(ticket)


@router.get("/admin/tickets", response_model=list[SupportTicketOut])
def admin_list_tickets(
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List ALL support tickets ordered by updated_at desc (admin only)."""
    tickets = db.query(SupportTicket).order_by(SupportTicket.updated_at.desc()).all()
    return [_build_ticket_out(t) for t in tickets]


@router.patch("/admin/tickets/{ticket_id}/status", response_model=SupportTicketOut)
def admin_update_ticket_status(
    ticket_id: int,
    payload: UpdateTicketStatus,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update a ticket's status (admin only). Auto-notifies owner when resolved."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    ticket.status = payload.status
    ticket.updated_at = datetime.now(timezone.utc)

    if payload.status == "resolved":
        notification = Notification(
            user_id=ticket.user_id,
            title="Support Ticket Resolved",
            message=f"Your ticket #{ticket.ticket_number} has been resolved.",
            type="success",
            related_url="/support",
        )
        db.add(notification)

    db.commit()
    db.refresh(ticket)
    return _build_ticket_out(ticket)


@router.post("/admin/tickets/{ticket_id}/reply", response_model=SupportMessageOut, status_code=status.HTTP_201_CREATED)
def admin_reply_to_ticket(
    ticket_id: int,
    payload: SupportReply,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin posts a reply to a support ticket."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    msg = SupportMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=payload.message,
        is_admin_reply=True,
    )
    db.add(msg)

    ticket.updated_at = datetime.now(timezone.utc)

    notification = Notification(
        user_id=ticket.user_id,
        title="New reply on your support ticket",
        message=f"An agent replied to ticket #{ticket.ticket_number}",
        type="info",
        related_url="/support",
    )
    db.add(notification)

    db.commit()
    db.refresh(msg)

    return SupportMessageOut(
        id=msg.id,
        ticket_id=msg.ticket_id,
        sender_id=msg.sender_id,
        sender_name=current_user.full_name,
        message=msg.message,
        is_admin_reply=msg.is_admin_reply,
        created_at=msg.created_at,
    )
