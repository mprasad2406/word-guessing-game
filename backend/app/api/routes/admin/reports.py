"""Admin API routes for Daily and User Gameplay Reporting."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.dependencies.authorization import require_admin
from app.dependencies.database import get_admin_reports_service
from app.models.user import User
from app.schemas.admin_reports import (
    DailyReportDetailResponse,
    DailyReportResponse,
    UserReportResponse,
)
from app.schemas.common import ApiResponse
from app.services.admin_reports_service import AdminReportsService

router = APIRouter(prefix="/reports", tags=["Admin - Reports"])


@router.get(
    "/daily",
    response_model=ApiResponse[DailyReportResponse],
    status_code=status.HTTP_200_OK,
    summary="Get daily gameplay reports",
    description="Admin-only endpoint returning daily aggregated statistics including active users, correct guesses, total games, and win rates.",
)
async def get_daily_reports(
    report_date: Optional[date] = Query(None, alias="date", description="Filter for a specific date (YYYY-MM-DD)"),
    start_date: Optional[date] = Query(None, description="Start date filter (inclusive)"),
    end_date: Optional[date] = Query(None, description="End date filter (inclusive)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_admin: User = Depends(require_admin),
    reports_service: AdminReportsService = Depends(get_admin_reports_service),
) -> ApiResponse[DailyReportResponse]:
    """Retrieve paginated daily performance metrics."""
    data = await reports_service.get_daily_reports(
        target_date=report_date,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success_response(data=data, message="Daily reports retrieved successfully")


@router.get(
    "/daily/{target_date}/details",
    response_model=ApiResponse[DailyReportDetailResponse],
    status_code=status.HTTP_200_OK,
    summary="Get daily session logs",
    description="Admin-only endpoint to retrieve paginated game sessions and guess logs for a specific single date.",
)
async def get_daily_details(
    target_date: date,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_admin: User = Depends(require_admin),
    reports_service: AdminReportsService = Depends(get_admin_reports_service),
) -> ApiResponse[DailyReportDetailResponse]:
    """Retrieve detailed game session logs for the specified date."""
    data = await reports_service.get_daily_details(
        target_date=target_date,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success_response(data=data, message="Daily session details retrieved successfully")


@router.get(
    "/users",
    response_model=ApiResponse[UserReportResponse],
    status_code=status.HTTP_200_OK,
    summary="Get user-wise gameplay reports",
    description="Admin-only endpoint returning date-wise gameplay performance summaries for individual users.",
)
async def get_user_reports(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    report_date: Optional[date] = Query(None, alias="date", description="Filter by specific date"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_admin: User = Depends(require_admin),
    reports_service: AdminReportsService = Depends(get_admin_reports_service),
) -> ApiResponse[UserReportResponse]:
    """Retrieve paginated user gameplay reports."""
    data = await reports_service.get_user_reports(
        user_id=user_id,
        target_date=report_date,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success_response(data=data, message="User reports retrieved successfully")
