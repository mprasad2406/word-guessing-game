"""Service for GameSettings management operations."""

from typing import Optional
from app.models.game_settings import GameSettings
from app.repositories.game_settings_repository import GameSettingsRepository
from app.schemas.game_settings import GameSettingsResponse, GameSettingsUpdateRequest
from app.services.admin_security_service import AdminSecurityService
from app.services.audit_service import AuditService


class GameSettingsService:
    """Business logic service for global GameSettings management."""

    def __init__(
        self,
        settings_repo: GameSettingsRepository,
        admin_security_service: AdminSecurityService,
        audit_service: AuditService,
    ) -> None:
        self.settings_repo = settings_repo
        self.security_service = admin_security_service
        self.audit_service = audit_service

    async def get_settings(self, admin_user_id: Optional[int] = None) -> GameSettingsResponse:
        """Fetch current global game settings (auto-creating defaults if none exist)."""
        settings = await self.settings_repo.get_or_create_default(created_by=admin_user_id)
        return GameSettingsResponse.model_validate(settings)

    async def update_settings(
        self,
        payload: GameSettingsUpdateRequest,
        admin_user_id: int,
        ip_address: Optional[str] = None,
    ) -> GameSettingsResponse:
        """
        Update global game settings.
        Requires admin security key if modifying critical settings
        (max_attempts, max_hints, min_word_length, max_word_length, scoring_multiplier, daily_word_limit, time_limit_seconds, default_difficulty, game_enabled).
        """
        if payload.modifies_critical_fields():
            await self.security_service.verify_security_key(payload.security_key)

        settings = await self.settings_repo.get_or_create_default(created_by=admin_user_id)
        update_data = payload.model_dump(exclude_unset=True, exclude={"security_key"})

        updated_settings = await self.settings_repo.update_settings(
            settings_entity=settings,
            update_data=update_data,
            updated_by=admin_user_id,
        )

        await self.audit_service.log_action(
            admin_user_id=admin_user_id,
            action="GAME_SETTINGS_UPDATED",
            target_type="GAME_SETTINGS",
            target_id=str(updated_settings.id),
            description=f"Updated game settings: {list(update_data.keys())}",
            ip_address=ip_address,
        )

        return GameSettingsResponse.model_validate(updated_settings)
