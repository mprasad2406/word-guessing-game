"""Service for creating and managing audit logs."""

import json
from typing import Any, Optional
from app.models.audit_log import AuditLog
from app.repositories.audit_log_repository import AuditLogRepository


class AuditService:
    """Service handling audit logging within database transactions."""

    def __init__(self, audit_repo: AuditLogRepository) -> None:
        self.audit_repo = audit_repo

    async def log_action(
        self,
        admin_user_id: int,
        action: str,
        target_type: str,
        target_id: Optional[Any] = None,
        description: Optional[str] = None,
        details: Optional[Any] = None,
        ip_address: Optional[str] = None,
        **kwargs: Any,
    ) -> AuditLog:
        """Create an audit log record in the active transaction."""
        formatted_target_id = str(target_id) if target_id is not None else None

        if description is None and details is not None:
            if isinstance(details, (dict, list)):
                try:
                    description = json.dumps(details)
                except Exception:
                    description = str(details)
            else:
                description = str(details)

        return await self.audit_repo.create_log(
            admin_user_id=admin_user_id,
            action=action,
            target_type=target_type,
            target_id=formatted_target_id,
            description=description,
            ip_address=ip_address,
        )

