"""User schemas and representation models."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.user import UserRole


class UserResponse(BaseModel):
    """Public user response schema (excluding password hash)."""

    id: int
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
