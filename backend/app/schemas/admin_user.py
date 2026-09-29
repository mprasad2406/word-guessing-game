"""Pydantic schemas for Admin User Management."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.user import UserRole


class UserStatsResponse(BaseModel):
    """Detailed user statistics and profile for administrators."""

    id: int
    public_id: str
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_active_at: Optional[datetime] = None
    total_games: int = 0
    games_won: int = 0
    games_lost: int = 0
    games_expired: int = 0
    active_games: int = 0
    win_rate: float = 0.0
    hints_used_total: int = 0
    attempts_used_total: int = 0
    average_attempts: float = 0.0
    average_duration_seconds: Optional[float] = None
    current_streak: int = 0

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Paginated user list for administrators."""

    items: List[UserStatsResponse]
    total: int
    page: int
    page_size: int
    pages: int


class UserOverviewStatsResponse(BaseModel):
    """High-level summary statistics across all registered users."""

    total_users: int
    active_users: int
    blocked_users: int
    active_7d_users: int


class UserStatusUpdateRequest(BaseModel):
    """Payload to block or unblock a user."""

    is_active: bool
