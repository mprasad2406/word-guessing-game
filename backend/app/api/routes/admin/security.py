"""Admin API routes for Security Key setup and management."""

from fastapi import APIRouter, Depends, Request, status

from app.core.rate_limit import limiter
from app.dependencies.authorization import require_admin
from app.dependencies.database import get_admin_security_service
from app.models.user import User
from app.schemas.admin_security import AdminSecretStatusResponse, SetAdminSecretRequest
from app.schemas.common import ApiResponse
from app.services.admin_security_service import AdminSecurityService

router = APIRouter(prefix="/security", tags=["Admin - Security Key"])


@router.get(
    "/status",
    response_model=ApiResponse[AdminSecretStatusResponse],
    status_code=status.HTTP_200_OK,
    summary="Get admin security key initialization status",
    description="Admin-only endpoint to check whether the secret key has been configured.",
)
async def get_security_status(
    current_admin: User = Depends(require_admin),
    security_service: AdminSecurityService = Depends(get_admin_security_service),
) -> ApiResponse[AdminSecretStatusResponse]:
    """Check security key setup status."""
    status_resp = await security_service.get_security_status()
    return ApiResponse.success_response(
        data=status_resp,
        message="Admin security status retrieved",
    )


@router.post(
    "/secret-key",
    response_model=ApiResponse[AdminSecretStatusResponse],
    status_code=status.HTTP_200_OK,
    summary="Set or rotate admin security key",
    description="Admin-only endpoint to initialize or rotate the security key used for dangerous actions.",
)
@limiter.limit("5/minute")
async def set_security_key(
    request: Request,
    payload: SetAdminSecretRequest,
    current_admin: User = Depends(require_admin),
    security_service: AdminSecurityService = Depends(get_admin_security_service),
) -> ApiResponse[AdminSecretStatusResponse]:
    """Initialize or update admin security key."""
    client_ip = request.client.host if request.client else None
    result = await security_service.set_security_key(
        admin_user_id=current_admin.id,
        new_key=payload.new_security_key,
        current_key=payload.current_security_key,
        ip_address=client_ip,
    )
    return ApiResponse.success_response(
        data=result,
        message="Admin security key configured successfully",
    )
