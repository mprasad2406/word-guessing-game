from datetime import datetime, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.core.exceptions import ValidationException
from app.models.game_session import GameStatus


def _format_utc_datetime(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


class GuessRequest(BaseModel):
    """Payload for submitting a guess."""

    guess: str = Field(..., min_length=1, max_length=50, description="The guessed word (alphabetic letters only).")

    @field_validator("guess")
    @classmethod
    def validate_guess(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValidationException("Guess must be a string")
        cleaned = v.strip().lower()
        if not cleaned:
            raise ValidationException("Guess cannot be empty")
        if not cleaned.isalpha():
            raise ValidationException("Guess must contain only alphabetic letters")
        return cleaned


class GuessItem(BaseModel):
    """Summary representation of a single guess attempt."""

    guess: str
    is_correct: bool
    attempt_number: int
    created_at: datetime
    letter_feedback: Optional[List[Literal["correct", "present", "absent"]]] = None

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at", when_used="json")
    def serialize_created_at(self, dt: datetime) -> Optional[str]:
        return _format_utc_datetime(dt)


class GameStateResponse(BaseModel):
    """
    Safe game state representation for active and finished games.
    The final_word field is strictly null while status is ACTIVE.
    """

    id: int
    public_id: str
    status: GameStatus
    word_length: int
    masked_pattern: str
    max_attempts: int
    attempts_used: int
    remaining_attempts: int
    max_hints: int
    hints_used: int
    hints_remaining: int
    revealed_hint: Optional[str] = None
    guesses: List[GuessItem] = Field(default_factory=list)
    started_at: datetime
    completed_at: Optional[datetime] = None
    final_word: Optional[str] = None
    time_limit_seconds: Optional[int] = None
    time_remaining_seconds: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("started_at", "completed_at", when_used="json")
    def serialize_game_state_dates(self, dt: Optional[datetime]) -> Optional[str]:
        return _format_utc_datetime(dt)


class HintResponse(BaseModel):
    """Response returned when a player requests a hint."""

    hint: str
    hints_used: int
    hints_remaining: int


class GameHistoryItem(BaseModel):
    """Summary item for player game history list."""

    id: int
    public_id: str
    status: GameStatus
    word_length: int
    max_attempts: int
    attempts_used: int
    hints_used: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    final_word: Optional[str] = None
    duration_seconds: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("started_at", "completed_at", when_used="json")
    def serialize_history_dates(self, dt: Optional[datetime]) -> Optional[str]:
        return _format_utc_datetime(dt)


class GameHistoryResponse(BaseModel):
    """Paginated player game history response."""

    items: List[GameHistoryItem]
    total: int
    page: int
    page_size: int
    pages: int


class DailyQuotaResponse(BaseModel):
    """Player daily game quota response (configurable limit, 0 = infinite)."""

    daily_limit: int = 3
    games_played_today: int
    games_remaining_today: Optional[int] = None
    can_start_game: bool
    is_unlimited: bool = False
