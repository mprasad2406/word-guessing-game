"""Repository for GameSettings database operations."""

from typing import Any, Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game_settings import GameSettings
from app.models.word import DifficultyLevel


class GameSettingsRepository:
    """Encapsulates async database operations for GameSettings singleton."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_settings(self) -> Optional[GameSettings]:
        """Fetch the singleton GameSettings record (id=1)."""
        statement = select(GameSettings).where(GameSettings.id == 1)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_or_create_default(self, created_by: Optional[int] = None) -> GameSettings:
        """Fetch existing settings or create default initial settings at id=1."""
        settings = await self.get_settings()
        if settings is None:
            settings = GameSettings(
                id=1,
                max_attempts=5,
                min_word_length=4,
                max_word_length=8,
                default_difficulty=DifficultyLevel.MEDIUM,
                max_hints=2,
                time_limit_seconds=300,
                scoring_multiplier=1.0,
                daily_word_limit=3,
                allow_repeated_guesses=False,
                allow_word_reuse=True,
                game_enabled=True,
                updated_by=created_by,
            )
            self.session.add(settings)
            await self.session.flush()
            await self.session.refresh(settings)
        return settings

    async def update_settings(
        self,
        settings_entity: GameSettings,
        update_data: Dict[str, Any],
        updated_by: int,
    ) -> GameSettings:
        """Apply updates to the GameSettings entity."""
        for field, value in update_data.items():
            if hasattr(settings_entity, field) and value is not None:
                setattr(settings_entity, field, value)

        settings_entity.updated_by = updated_by
        await self.session.flush()
        await self.session.refresh(settings_entity)
        return settings_entity
