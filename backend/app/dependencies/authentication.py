"""Authentication dependencies for verifying tokens and resolving current user."""

from typing import Optional
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import (
    AuthenticationRequiredException,
    InvalidTokenException,
    UserInactiveException,
)
from app.core.security import decode_access_token
from app.dependencies.database import get_user_repository
from app.models.user import User
from app.repositories.user_repository import UserRepository

# HTTPBearer scheme without automatic 403 error to allow standard AppException handling
security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    """
    Extract and decode JWT from Authorization Bearer header,
    retrieving the user entity from the database.
    """
    if not credentials or credentials.scheme.lower() != "bearer":
        raise AuthenticationRequiredException("Authentication token is required")

    token = credentials.credentials
    payload = decode_access_token(token)

    try:
        user_id = int(payload.get("sub", 0))
    except (ValueError, TypeError):
        raise InvalidTokenException("Invalid token subject")

    user = await user_repo.get_by_id(user_id)
    if not user:
        raise InvalidTokenException("User no longer exists")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Verify that the currently authenticated user is active."""
    if not current_user.is_active:
        raise UserInactiveException("Account is blocked. Please contact the administrator.")
    return current_user

