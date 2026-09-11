"""Pydantic schemas for Admin User Management."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.user import UserRole


class UserStatsResponse(BaseModel):
    """Detailed user statistics and profile for administrators."""

    id: int
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    total_games: int
    games_won: int
    games_lost: int
    games_expired: int
    active_games: int
    win_rate: float
    hints_used_total: int
    attempts_used_total: int

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Paginated user list for administrators."""

    items: List[UserStatsResponse]
    total: int
    page: int
    page_size: int
    pages: int


class UserStatusUpdateRequest(BaseModel):
    """Payload to block or unblock a user."""

    is_active: bool
