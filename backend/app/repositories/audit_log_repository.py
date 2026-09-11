"""Repository for AuditLog database operations."""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogRepository:
    """Encapsulates async database operations for AuditLog entries."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_log(
        self,
        admin_user_id: int,
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        description: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """Record an audit log entry in the current transaction."""
        log = AuditLog(
            admin_user_id=admin_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            description=description,
            ip_address=ip_address,
        )
        self.session.add(log)
        await self.session.flush()
        return log
