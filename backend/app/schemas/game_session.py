"""Pydantic schemas for GameSession (safe representation without revealing the hidden word)."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.game_session import GameStatus


class GameSessionResponse(BaseModel):
    """
    Public representation of a game session.
    Note: The hidden word itself is strictly excluded to prevent cheating.
    """

    id: int
    player_id: int
    status: GameStatus
    max_attempts: int
    attempts_used: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
