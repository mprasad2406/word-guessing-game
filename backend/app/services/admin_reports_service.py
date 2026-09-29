"""Business logic service for Admin Reporting and PDF Generation."""

import io
from datetime import date
from typing import Optional, Tuple
from app.core.exceptions import AppException, ErrorCode
from app.models.game_session import GameSession
from app.repositories.admin_reports_repository import AdminReportsRepository
from app.repositories.user_repository import UserRepository
from app.schemas.admin_reports import (
    DailyReportDetailResponse,
    DailyReportResponse,
    DailyReportSummary,
    DailySessionDetail,
    UserReportResponse,
    UserReportSummary,
)
from app.services.pdf_report_service import PDFReportService


class AdminReportsService:
    """Service handling aggregation, mapping, detail extraction, and PDF export for admin reports."""

    def __init__(
        self,
        reports_repo: AdminReportsRepository,
        user_repo: Optional[UserRepository] = None,
        pdf_service: Optional[PDFReportService] = None,
    ) -> None:
        self.reports_repo = reports_repo
        self.user_repo = user_repo
        self.pdf_service = pdf_service or PDFReportService()

    async def get_daily_reports(
        self,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> DailyReportResponse:
        """Fetch paginated daily gameplay performance summaries."""
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        summaries_data, total = await self.reports_repo.get_daily_summaries(
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
            page=page,
            page_size=page_size,
        )

        summaries = [DailyReportSummary(**s) for s in summaries_data]
        pages = (total + page_size - 1) // page_size if total > 0 else 1

        return DailyReportResponse(
            summaries=summaries,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def get_daily_details(
        self,
        target_date: date,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> DailyReportDetailResponse:
        """Fetch paginated game session logs for a specific date with optional status and player search filters."""
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 10

        sessions, total = await self.reports_repo.get_daily_details(
            target_date=target_date,
            status=status,
            search=search,
            page=page,
            page_size=page_size,
        )

        session_details = [
            DailySessionDetail(
                session_id=s.id,
                session_public_id=s.public_id,
                player_id=s.player_id,
                player_public_id=s.player.public_id if s.player else None,
                username=s.player.username if s.player else f"User #{s.player_id}",
                target_word=s.word.word if s.word else "N/A",
                status=s.status,
                attempts_used=s.attempts_used,
                max_attempts=s.max_attempts,
                guesses=[g.guess for g in s.guesses],
                started_at=s.started_at,
                completed_at=s.completed_at,
            )
            for s in sessions
        ]

        pages = (total + page_size - 1) // page_size if total > 0 else 1

        return DailyReportDetailResponse(
            date=target_date,
            sessions=session_details,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def get_user_reports(
        self,
        user_id: Optional[int] = None,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> UserReportResponse:
        """Fetch paginated user performance summaries by date."""
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        user_data, total = await self.reports_repo.get_user_summaries(
            user_id=user_id,
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
            page=page,
            page_size=page_size,
        )

        summaries = [UserReportSummary(**u) for u in user_data]
        pages = (total + page_size - 1) // page_size if total > 0 else 1

        return UserReportResponse(
            summaries=summaries,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def export_daily_report_pdf(
        self,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Tuple[io.BytesIO, str]:
        """
        Fetch all daily summary records for the given date range and compile a professional PDF document.
        Returns a tuple of (BytesIO buffer, filename).
        """
        if start_date and end_date and start_date > end_date:
            raise AppException(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Start date cannot be after end date.",
            )

        # Retrieve all summaries (up to 1000 days)
        summaries_data, _ = await self.reports_repo.get_daily_summaries(
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
            page=1,
            page_size=1000,
        )

        # Generate filename
        if target_date:
            filename = f"Daily_Report_{target_date.isoformat()}.pdf"
        elif start_date and end_date:
            filename = f"Daily_Report_{start_date.isoformat()}_to_{end_date.isoformat()}.pdf"
        elif start_date:
            filename = f"Daily_Report_from_{start_date.isoformat()}.pdf"
        elif end_date:
            filename = f"Daily_Report_until_{end_date.isoformat()}.pdf"
        else:
            filename = f"Daily_Report_All_Time.pdf"

        pdf_buffer = self.pdf_service.generate_daily_report_pdf(
            summaries=summaries_data,
            start_date=start_date,
            end_date=end_date,
            target_date=target_date,
        )

        return pdf_buffer, filename

    async def export_player_report_pdf(
        self,
        player_identifier: str,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Tuple[io.BytesIO, str]:
        """
        Fetch all date-wise performance records for a specific player and compile a professional PDF document.
        Returns a tuple of (BytesIO buffer, filename).
        """
        if start_date and end_date and start_date > end_date:
            raise AppException(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Start date cannot be after end date.",
            )

        # Resolve user
        user = None
        if self.user_repo:
            user = await self.user_repo.get_by_identifier(player_identifier)
        
        if not user:
            # Fallback: check if integer ID
            if str(player_identifier).isdigit():
                user_id = int(player_identifier)
                username = f"User #{user_id}"
                role = "PLAYER"
            else:
                raise AppException(
                    error_code=ErrorCode.NOT_FOUND,
                    message=f"Player '{player_identifier}' not found.",
                )
        else:
            user_id = user.id
            username = user.username
            role = user.role.value if hasattr(user.role, "value") else str(user.role)

        # Retrieve all user summaries for this period
        user_data, _ = await self.reports_repo.get_user_summaries(
            user_id=user_id,
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
            page=1,
            page_size=1000,
        )

        # Generate filename
        date_part = ""
        if target_date:
            date_part = f"_{target_date.isoformat()}"
        elif start_date and end_date:
            date_part = f"_{start_date.isoformat()}_to_{end_date.isoformat()}"
        elif start_date:
            date_part = f"_{start_date.isoformat()}"
        else:
            date_part = f"_{date.today().strftime('%Y-%m')}"

        safe_username = "".join(c for c in username if c.isalnum() or c in ("-", "_"))
        filename = f"Player_Report_{safe_username}{date_part}.pdf"

        pdf_buffer = self.pdf_service.generate_player_report_pdf(
            username=username,
            role=role,
            user_summaries=user_data,
            start_date=start_date,
            end_date=end_date,
            target_date=target_date,
        )

        return pdf_buffer, filename
