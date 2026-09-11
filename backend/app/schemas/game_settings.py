"""Pydantic schemas for GameSettings."""

from datetime import datetime
from typing import Any, Dict, Optional, Set
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.exceptions import ValidationException
from app.models.word import DifficultyLevel

# Set of settings fields considered critical which require the admin security key
CRITICAL_SETTINGS_FIELDS: Set[str] = {
    "max_attempts",
    "min_word_length",
    "max_word_length",
    "scoring_multiplier",
    "daily_word_limit",
    "game_enabled",
}


class GameSettingsResponse(BaseModel):
    """Schema for returning current game settings."""

    id: int
    max_attempts: int
    min_word_length: int
    max_word_length: int
    default_difficulty: DifficultyLevel
    max_hints: int
    time_limit_seconds: Optional[int]
    scoring_multiplier: float
    daily_word_limit: int = 3
    allow_repeated_guesses: bool
    allow_word_reuse: bool
    game_enabled: bool
    updated_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GameSettingsUpdateRequest(BaseModel):
    """Schema for modifying game configuration settings."""

    max_attempts: Optional[int] = Field(None, gt=0, description="Maximum guess attempts per game.")
    min_word_length: Optional[int] = Field(None, gt=0, description="Minimum allowable word length.")
    max_word_length: Optional[int] = Field(None, gt=0, description="Maximum allowable word length.")
    default_difficulty: Optional[DifficultyLevel] = Field(None, description="Default difficulty for games.")
    max_hints: Optional[int] = Field(None, ge=0, description="Maximum hints allowed per game.")
    time_limit_seconds: Optional[int] = Field(None, ge=0, description="Game time limit in seconds (0 or null for unlimited).")
    scoring_multiplier: Optional[float] = Field(None, gt=0.0, description="Base scoring multiplier.")
    daily_word_limit: Optional[int] = Field(None, ge=0, description="Daily words guessing limit per player (0 for unlimited/infinite).")
    allow_repeated_guesses: Optional[bool] = Field(None, description="Whether players can guess the same letter/word repeatedly.")
    allow_word_reuse: Optional[bool] = Field(None, description="Whether words can be reused across games for the same player.")
    game_enabled: Optional[bool] = Field(None, description="Global game toggle.")

    # Write-only security key for dangerous/critical modifications
    security_key: Optional[str] = Field(
        None,
        description="Admin security key required if modifying any critical setting (max_attempts, min_word_length, max_word_length, scoring_multiplier, game_enabled).",
    )

    @model_validator(mode="after")
    def validate_lengths(self) -> "GameSettingsUpdateRequest":
        if self.min_word_length is not None and self.max_word_length is not None:
            if self.min_word_length > self.max_word_length:
                raise ValidationException("min_word_length cannot exceed max_word_length")
        return self

    def modifies_critical_fields(self) -> bool:
        """Check whether any critical settings are included in this update request."""
        provided_fields = self.model_dump(exclude_unset=True)
        return any(field in CRITICAL_SETTINGS_FIELDS for field in provided_fields)
