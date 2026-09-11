"""Pydantic schemas for Admin Daily and User reporting."""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.models.game_session import GameStatus


class DailyReportSummary(BaseModel):
    """Aggregated daily gameplay performance summary."""

    date: date
    number_of_users: int
    number_of_correct_guesses: int
    total_games: int
    games_won: int
    total_guesses: int
    win_rate: float

    model_config = ConfigDict(from_attributes=True)


class DailySessionDetail(BaseModel):
    """Detailed game session entry for a specific date."""

    session_id: int
    player_id: int
    username: str
    target_word: str
    status: GameStatus
    attempts_used: int
    max_attempts: int
    guesses: List[str]
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DailyReportResponse(BaseModel):
    """Paginated daily summaries response."""

    summaries: List[DailyReportSummary]
    total: int
    page: int
    page_size: int
    pages: int


class DailyReportDetailResponse(BaseModel):
    """Paginated game session details for a single selected date."""

    date: date
    sessions: List[DailySessionDetail]
    total: int
    page: int
    page_size: int
    pages: int


class UserReportSummary(BaseModel):
    """Aggregated user performance summary by date."""

    user_id: int
    username: str
    date: date
    words_tried: int
    total_games: int
    correct_guesses: int
    total_guesses: int
    games_won: int
    win_rate: float

    model_config = ConfigDict(from_attributes=True)


class UserReportResponse(BaseModel):
    """Paginated user reports response."""

    summaries: List[UserReportSummary]
    total: int
    page: int
    page_size: int
    pages: int
