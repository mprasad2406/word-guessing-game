"""Authentication schemas for registration, login, and JWT tokens."""

from typing import Optional
from pydantic import BaseModel, field_validator
from app.schemas.user import UserResponse
from app.utils.validators import validate_password, validate_username


class RegisterRequest(BaseModel):
    """User registration payload."""

    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_and_normalize_username(cls, v: str) -> str:
        return validate_username(v)

    @field_validator("password")
    @classmethod
    def validate_password_rules(cls, v: str) -> str:
        return validate_password(v)


class LoginRequest(BaseModel):
    """User login payload."""

    username: str
    password: str

    @field_validator("username")
    @classmethod
    def normalize_username(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v


class RefreshTokenRequest(BaseModel):
    """Token refresh payload."""

    refresh_token: str


class TokenResponse(BaseModel):
    """Successful authentication token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    user: UserResponse


class TokenPayload(BaseModel):
    """Decoded JWT payload data."""

    sub: str
    role: str
    exp: int
    iat: int
    jti: str
    type: str
