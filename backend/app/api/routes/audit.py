from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter(prefix="/admin/audit-logs", tags=["audit"])


class AuditLogOut(BaseModel):
    id: int
    admin_id: int
    admin_name: Optional[str] = None
    admin_email: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    summary: Optional[str] = None
    details: Optional[Any] = None
    created_at: datetime

    model_config = {"from_attributes": True}


def _build_out(log: AuditLog) -> AuditLogOut:
    details_parsed: Any = None
    if log.details:
        try:
            details_parsed = json.loads(log.details)
        except Exception:
            details_parsed = log.details

    return AuditLogOut(
        id=log.id,
        admin_id=log.admin_id,
        admin_name=log.admin.full_name if log.admin else None,
        admin_email=log.admin.email if log.admin else None,
        action=log.action,
        entity_type=log.entity_type,
        entity_id=log.entity_id,
        summary=log.summary,
        details=details_parsed,
        created_at=log.created_at,
    )


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    logs = q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [_build_out(log) for log in logs]
