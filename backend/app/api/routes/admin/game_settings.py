"""Admin API routes for GameSettings configuration."""

from fastapi import APIRouter, Depends, Request, status

from app.dependencies.authorization import require_admin
from app.dependencies.database import get_game_settings_service
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.game_settings import GameSettingsResponse, GameSettingsUpdateRequest
from app.services.game_settings_service import GameSettingsService

router = APIRouter(prefix="/game-settings", tags=["Admin - Game Settings"])


@router.get(
    "",
    response_model=ApiResponse[GameSettingsResponse],
    status_code=status.HTTP_200_OK,
    summary="View current game settings",
    description="Admin-only endpoint to retrieve current global game configuration settings.",
)
async def get_game_settings(
    current_admin: User = Depends(require_admin),
    settings_service: GameSettingsService = Depends(get_game_settings_service),
) -> ApiResponse[GameSettingsResponse]:
    """Retrieve current game settings."""
    settings = await settings_service.get_settings(admin_user_id=current_admin.id)
    return ApiResponse.success_response(
        data=settings,
        message="Game settings retrieved successfully",
    )


@router.patch(
    "",
    response_model=ApiResponse[GameSettingsResponse],
    status_code=status.HTTP_200_OK,
    summary="Update game settings",
    description="Admin-only endpoint to modify game configuration settings. Requires security_key in request body if modifying critical parameters.",
)
async def update_game_settings(
    request: Request,
    payload: GameSettingsUpdateRequest,
    current_admin: User = Depends(require_admin),
    settings_service: GameSettingsService = Depends(get_game_settings_service),
) -> ApiResponse[GameSettingsResponse]:
    """Update game settings."""
    client_ip = request.client.host if request.client else None
    updated_settings = await settings_service.update_settings(
        payload=payload,
        admin_user_id=current_admin.id,
        ip_address=client_ip,
    )
    return ApiResponse.success_response(
        data=updated_settings,
        message="Game settings updated successfully",
    )
