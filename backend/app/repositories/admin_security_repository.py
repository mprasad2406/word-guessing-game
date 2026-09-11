"""Repository for AdminSecuritySettings database operations."""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_security import AdminSecuritySettings


class AdminSecurityRepository:
    """Encapsulates async database operations for AdminSecuritySettings singleton."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_security_settings(self) -> Optional[AdminSecuritySettings]:
        """Fetch the singleton AdminSecuritySettings record (id=1)."""
        statement = select(AdminSecuritySettings).where(AdminSecuritySettings.id == 1)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def set_security_key_hash(
        self,
        secret_key_hash: str,
        updated_by: int,
    ) -> AdminSecuritySettings:
        """Create or update the admin security key hash."""
        existing = await self.get_security_settings()
        if existing is None:
            existing = AdminSecuritySettings(
                id=1,
                secret_key_hash=secret_key_hash,
                updated_by=updated_by,
            )
            self.session.add(existing)
        else:
            existing.secret_key_hash = secret_key_hash
            existing.updated_by = updated_by
            existing.updated_at = datetime.now(timezone.utc)

        await self.session.flush()
        await self.session.refresh(existing)
        return existing
