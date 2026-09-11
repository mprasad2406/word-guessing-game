"""Pydantic schemas for Admin Security Key operations."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SetAdminSecretRequest(BaseModel):
    """Payload to initialize or update the admin security key."""

    current_security_key: Optional[str] = Field(
        None,
        description="Current security key. Required if the security key has already been initialized.",
    )
    new_security_key: str = Field(
        ...,
        min_length=8,
        description="New admin security key (at least 8 characters).",
    )


class AdminSecretStatusResponse(BaseModel):
    """Status indicating whether the admin security key has been initialized."""

    is_initialized: bool
    updated_at: Optional[datetime] = None
