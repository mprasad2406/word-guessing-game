"""Health check API route."""

from typing import Dict
from fastapi import APIRouter
from app.schemas.common import ApiResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=ApiResponse[Dict[str, str]],
    summary="System health check",
    description="Returns the operational status of the service. Useful for uptime and load balancer checks.",
)
async def health_check() -> ApiResponse[Dict[str, str]]:
    """Health status check endpoint."""
    return ApiResponse.success_response(
        data={"status": "ok"},
        message="Service is healthy",
    )
