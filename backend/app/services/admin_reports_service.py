"""Business logic service for Admin Reporting."""

from datetime import date
from typing import Optional
from app.models.game_session import GameSession
from app.repositories.admin_reports_repository import AdminReportsRepository
from app.schemas.admin_reports import (
    DailyReportDetailResponse,
    DailyReportResponse,
    DailyReportSummary,
    DailySessionDetail,
    UserReportResponse,
    UserReportSummary,
)


class AdminReportsService:
    """Service handling aggregation, mapping, and detail extraction for admin reports."""

    def __init__(self, reports_repo: AdminReportsRepository) -> None:
        self.reports_repo = reports_repo

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
        page: int = 1,
        page_size: int = 20,
    ) -> DailyReportDetailResponse:
        """Fetch paginated game session logs for a specific date."""
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        sessions, total = await self.reports_repo.get_daily_details(
            target_date=target_date,
            page=page,
            page_size=page_size,
        )

        session_details = [
            DailySessionDetail(
                session_id=s.id,
                player_id=s.player_id,
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
