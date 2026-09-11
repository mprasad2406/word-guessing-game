"""Role-based authorization dependencies."""

from typing import Callable
from fastapi import Depends

from app.core.exceptions import ForbiddenException
from app.dependencies.authentication import get_current_active_user
from app.models.user import User, UserRole


def require_role(required_role: UserRole) -> Callable[[User], User]:
    """Dependency factory that enforces a specific UserRole."""

    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role != required_role:
            raise ForbiddenException(
                f"Access forbidden: required role '{required_role.value}'"
            )
        return current_user

    return role_checker


def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Convenience dependency requiring ADMIN role."""
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenException("Access forbidden: admin privileges required")
    return current_user


def require_player(current_user: User = Depends(get_current_active_user)) -> User:
    """Convenience dependency requiring PLAYER role (Admins cannot play)."""
    if current_user.role != UserRole.PLAYER:
        raise ForbiddenException("Access forbidden: administrators cannot participate in gameplay")
    return current_user

