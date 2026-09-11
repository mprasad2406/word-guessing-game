"""Admin API routes for User Management, Profile Inspection, and Access Control."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status

from app.dependencies.authorization import require_admin
from app.dependencies.database import get_admin_user_service
from app.models.game_session import GameStatus
from app.models.user import User, UserRole
from app.schemas.admin_user import (
    UserListResponse,
    UserStatsResponse,
    UserStatusUpdateRequest,
)
from app.schemas.common import ApiResponse
from app.schemas.gameplay import GameHistoryResponse
from app.services.admin_user_service import AdminUserService

router = APIRouter(prefix="/users", tags=["Admin - Users"])


@router.get(
    "",
    response_model=ApiResponse[UserListResponse],
    status_code=status.HTTP_200_OK,
    summary="List all users with stats",
    description="Admin-only endpoint to retrieve paginated users with gameplay metrics, filtering by role, status, or search term.",
)
async def list_users(
    role: Optional[UserRole] = Query(None, description="Filter by user role (PLAYER, ADMIN)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by username"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_admin: User = Depends(require_admin),
    user_service: AdminUserService = Depends(get_admin_user_service),
) -> ApiResponse[UserListResponse]:
    """Retrieve paginated users list."""
    users_data = await user_service.list_users(
        role=role,
        is_active=is_active,
        search=search,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success_response(
        data=users_data,
        message="Users list retrieved successfully",
    )


@router.get(
    "/{user_id}",
    response_model=ApiResponse[UserStatsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get detailed user profile and metrics",
    description="Admin-only endpoint to retrieve detailed profile, gameplay totals, and win rate for a user.",
)
async def get_user_details(
    user_id: int,
    current_admin: User = Depends(require_admin),
    user_service: AdminUserService = Depends(get_admin_user_service),
) -> ApiResponse[UserStatsResponse]:
    """Retrieve detailed user statistics and profile."""
    user_details = await user_service.get_user_details(user_id=user_id)
    return ApiResponse.success_response(
        data=user_details,
        message="User profile retrieved successfully",
    )


@router.patch(
    "/{user_id}/status",
    response_model=ApiResponse[UserStatsResponse],
    status_code=status.HTTP_200_OK,
    summary="Update user active/blocked status",
    description="Admin-only endpoint to block or unblock user access.",
)
async def update_user_status(
    request: Request,
    user_id: int,
    payload: UserStatusUpdateRequest,
    current_admin: User = Depends(require_admin),
    user_service: AdminUserService = Depends(get_admin_user_service),
) -> ApiResponse[UserStatsResponse]:
    """Block or unblock a user."""
    client_ip = request.client.host if request.client else None
    updated_user = await user_service.update_user_status(
        user_id=user_id,
        is_active=payload.is_active,
        admin_user_id=current_admin.id,
        ip_address=client_ip,
    )
    action_text = "unblocked" if payload.is_active else "blocked"
    return ApiResponse.success_response(
        data=updated_user,
        message=f"User {action_text} successfully",
    )


@router.get(
    "/{user_id}/games",
    response_model=ApiResponse[GameHistoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get user game history",
    description="Admin-only endpoint to retrieve paginated match history for a specific user.",
)
async def get_user_games(
    user_id: int,
    status: Optional[GameStatus] = Query(None, description="Filter by game status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_admin: User = Depends(require_admin),
    user_service: AdminUserService = Depends(get_admin_user_service),
) -> ApiResponse[GameHistoryResponse]:
    """Retrieve match history for a user."""
    history = await user_service.get_user_game_history(
        user_id=user_id,
        status=status,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success_response(
        data=history,
        message="User game history retrieved successfully",
    )
