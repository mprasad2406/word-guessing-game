"""Service for managing admin security keys and verifying dangerous actions."""

from typing import Optional
from app.core.exceptions import (
    InvalidSecurityKeyException,
    SecurityKeyNotInitializedException,
    SecurityKeyRequiredException,
    ValidationException,
)
from app.core.security import hash_password, verify_password
from app.repositories.admin_security_repository import AdminSecurityRepository
from app.schemas.admin_security import AdminSecretStatusResponse
from app.services.audit_service import AuditService


class AdminSecurityService:
    """Encapsulates admin security key verification and updates using Argon2id."""

    def __init__(
        self,
        security_repo: AdminSecurityRepository,
        audit_service: AuditService,
    ) -> None:
        self.security_repo = security_repo
        self.audit_service = audit_service

    async def verify_security_key(self, provided_key: Optional[str]) -> None:
        """
        Verify the provided security key against the stored Argon2id hash.
        
        Raises:
            SecurityKeyRequiredException: If key is missing.
            SecurityKeyNotInitializedException: If key has not been setup yet.
            InvalidSecurityKeyException: If key verification fails.
        """
        if not provided_key or not provided_key.strip():
            raise SecurityKeyRequiredException("Security key is required for this dangerous action")

        security_settings = await self.security_repo.get_security_settings()
        if not security_settings or not security_settings.secret_key_hash:
            raise SecurityKeyNotInitializedException(
                "Admin security key has not been initialized. Please set it up via /admin/security/secret-key first."
            )

        if not verify_password(provided_key.strip(), security_settings.secret_key_hash):
            raise InvalidSecurityKeyException("Invalid security key")

    async def set_security_key(
        self,
        admin_user_id: int,
        new_key: str,
        current_key: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> AdminSecretStatusResponse:
        """
        Initialize or rotate the admin security key.
        If already initialized, verifying current_key is mandatory.
        """
        cleaned_new_key = new_key.strip()
        if len(cleaned_new_key) < 8:
            raise ValidationException("New security key must contain at least 8 characters")

        existing_settings = await self.security_repo.get_security_settings()

        if existing_settings is not None and existing_settings.secret_key_hash:
            # Updating existing key requires verifying the current key
            if not current_key or not current_key.strip():
                raise SecurityKeyRequiredException("Current security key is required to update the security key")
            if not verify_password(current_key.strip(), existing_settings.secret_key_hash):
                raise InvalidSecurityKeyException("Invalid current security key")
            action = "ADMIN_SECRET_CHANGED"
            description = "Admin security key rotated successfully"
        else:
            action = "ADMIN_SECRET_INITIALIZED"
            description = "Initial admin security key created"

        hashed_key = hash_password(cleaned_new_key)
        updated_settings = await self.security_repo.set_security_key_hash(
            secret_key_hash=hashed_key,
            updated_by=admin_user_id,
        )

        await self.audit_service.log_action(
            admin_user_id=admin_user_id,
            action=action,
            target_type="ADMIN_SECURITY",
            target_id=str(updated_settings.id),
            description=description,
            ip_address=ip_address,
        )

        return AdminSecretStatusResponse(
            is_initialized=True,
            updated_at=updated_settings.updated_at,
        )

    async def get_security_status(self) -> AdminSecretStatusResponse:
        """Check whether the admin security key has been initialized."""
        settings = await self.security_repo.get_security_settings()
        if settings is None:
            return AdminSecretStatusResponse(is_initialized=False, updated_at=None)
        return AdminSecretStatusResponse(
            is_initialized=True,
            updated_at=settings.updated_at,
        )
