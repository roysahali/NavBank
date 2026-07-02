from __future__ import annotations

import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_audit(
    db: Session,
    admin_id: int,
    action: str,
    *,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    summary: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
) -> None:
    entry = AuditLog(
        admin_id=admin_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary,
        details=json.dumps(details) if details else None,
    )
    db.add(entry)
