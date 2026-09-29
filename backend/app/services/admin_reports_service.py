"""Business logic service for Admin Reporting and PDF Generation."""

import io
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple
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
        summary_only: bool = False,
        password: Optional[str] = None,
    ) -> Tuple[io.BytesIO, str]:
        """
        Fetch all daily summary records, player participation breakdown, word statistics,
        and session logs for the given period and compile a multi-page analytical PDF report.
        Returns a tuple of (BytesIO buffer, filename).
        """
        if start_date and end_date and start_date > end_date:
            raise AppException(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Start date cannot be after end date.",
            )

        # 0. Automatically expire stale active sessions that exceeded their configured time limit
        await self.reports_repo.expire_stale_active_sessions()

        # 1. Retrieve all daily summaries (up to 1000 days)
        summaries_data, _ = await self.reports_repo.get_daily_summaries(
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
            page=1,
            page_size=1000,
        )

        # 2. Retrieve player participation breakdown
        participation = await self.reports_repo.get_player_participation_summaries(
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
        )

        # 3. Retrieve target word attempt statistics
        word_stats = await self.reports_repo.get_word_statistics(
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
        )

        # 4. Retrieve detailed sessions (unless summary_only)
        sessions = []
        if not summary_only:
            sessions = await self.reports_repo.get_period_sessions(
                target_date=target_date,
                start_date=start_date,
                end_date=end_date,
                limit=2000,
            )

        # 5. Generate descriptive filename
        if target_date:
            filename = f"Daily_Report_{target_date.isoformat()}.pdf"
        elif start_date and end_date:
            filename = f"Daily_Report_{start_date.isoformat()}_to_{end_date.isoformat()}.pdf"
        elif start_date:
            filename = f"Daily_Report_from_{start_date.isoformat()}.pdf"
        elif end_date:
            filename = f"Daily_Report_until_{end_date.isoformat()}.pdf"
        else:
            filename = f"Daily_Report_All_Time_{date.today().isoformat()}.pdf"

        pdf_buffer = self.pdf_service.generate_daily_report_pdf(
            summaries=summaries_data,
            participation=participation,
            word_stats=word_stats,
            sessions=sessions,
            start_date=start_date,
            end_date=end_date,
            target_date=target_date,
            summary_only=summary_only,
            password=password,
        )

        return pdf_buffer, filename

    async def export_player_report_pdf(
        self,
        player_identifier: str,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        summary_only: bool = False,
        password: Optional[str] = None,
    ) -> Tuple[io.BytesIO, str]:
        """
        Fetch full player profile, lifetime metrics, period metrics, daily records,
        attempt distribution, and chronological match history for an individual player.
        Returns a tuple of (BytesIO buffer, filename).
        """
        if start_date and end_date and start_date > end_date:
            raise AppException(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Start date cannot be after end date.",
            )

        # 0. Automatically expire stale active sessions
        await self.reports_repo.expire_stale_active_sessions()

        # 1. Resolve user profile
        user = None
        if self.user_repo:
            user = await self.user_repo.get_by_identifier(player_identifier)

        if not user:
            if str(player_identifier).isdigit():
                user_id = int(player_identifier)
                if self.user_repo:
                    user = await self.user_repo.get_by_id(user_id)
                username = user.username if user else f"User #{user_id}"
                role = user.role.value if user and hasattr(user.role, "value") else "PLAYER"
            else:
                raise AppException(
                    error_code=ErrorCode.NOT_FOUND,
                    message=f"Player '{player_identifier}' not found.",
                )
        else:
            user_id = user.id
            username = user.username
            role = user.role.value if hasattr(user.role, "value") else str(user.role)

        # 2. Lifetime statistics
        lifetime_stats = await self.reports_repo.get_player_lifetime_stats(user_id=user_id)

        # 3. Retrieve period user summaries (daily records)
        user_data, _ = await self.reports_repo.get_user_summaries(
            user_id=user_id,
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
            page=1,
            page_size=1000,
        )

        # 4. Period aggregates
        tot_games = sum(u.get("total_games", 0) for u in user_data)
        tot_won = sum(u.get("games_won", 0) for u in user_data)
        tot_guesses = sum(u.get("total_guesses", 0) for u in user_data)
        tot_corr_guesses = sum(u.get("correct_guesses", 0) for u in user_data)
        p_win_rate = round((tot_won / tot_games * 100.0), 1) if tot_games > 0 else 0.0

        period_stats = {
            "total_games": tot_games,
            "games_won": tot_won,
            "games_lost": max(0, tot_games - tot_won),
            "total_guesses": tot_guesses,
            "correct_guesses": tot_corr_guesses,
            "win_rate": p_win_rate,
        }

        # 5. Attempts distribution
        attempts_dist = await self.reports_repo.get_player_attempts_distribution(
            player_id=user_id,
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
        )

        # 6. Detailed match history (unless summary_only)
        sessions = []
        if not summary_only:
            sessions = await self.reports_repo.get_period_sessions(
                target_date=target_date,
                start_date=start_date,
                end_date=end_date,
                player_id=user_id,
                limit=2000,
            )

        # 7. Generate descriptive filename
        date_part = ""
        if target_date:
            date_part = f"_{target_date.isoformat()}"
        elif start_date and end_date:
            date_part = f"_{start_date.isoformat()}_to_{end_date.isoformat()}"
        elif start_date:
            date_part = f"_{start_date.isoformat()}"
        else:
            date_part = f"_All_Time_{date.today().isoformat()}"

        safe_username = "".join(c for c in username if c.isalnum() or c in ("-", "_"))
        filename = f"Player_Report_{safe_username}{date_part}.pdf"

        pdf_buffer = self.pdf_service.generate_player_report_pdf(
            username=username,
            role=role,
            user_obj=user,
            lifetime_stats=lifetime_stats,
            period_stats=period_stats,
            daily_records=user_data,
            attempts_dist=attempts_dist,
            sessions=sessions,
            start_date=start_date,
            end_date=end_date,
            target_date=target_date,
            summary_only=summary_only,
            password=password,
        )

        return pdf_buffer, filename

    async def get_daily_report_dataset(
        self,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        summary_only: bool = False,
    ) -> Dict[str, Any]:
        """
        Aggregate and structure the entire daily gameplay analytics dataset for frontend rendering.
        """
        if start_date and end_date and start_date > end_date:
            raise AppException(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Start date cannot be after end date.",
            )

        # 0. Expire stale sessions
        await self.reports_repo.expire_stale_active_sessions()

        # 1. Summaries
        summaries_data, _ = await self.reports_repo.get_daily_summaries(
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
            page=1,
            page_size=1000,
        )

        # 2. Participation
        participation = await self.reports_repo.get_player_participation_summaries(
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
        )

        # 3. Word stats
        word_stats = await self.reports_repo.get_word_statistics(
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
        )

        # 4. Sessions
        sessions_list = []
        if not summary_only:
            raw_sessions = await self.reports_repo.get_period_sessions(
                target_date=target_date,
                start_date=start_date,
                end_date=end_date,
                limit=2000,
            )
            for s in raw_sessions:
                dur_sec = None
                if s.started_at and s.completed_at:
                    dur_sec = max(0, int((s.completed_at - s.started_at).total_seconds()))
                
                sessions_list.append({
                    "id": s.id,
                    "player_id": s.player_id,
                    "username": s.player.username if s.player else f"User #{s.player_id}",
                    "target_word": s.word.word.upper() if s.word else "N/A",
                    "started_at": s.started_at.isoformat() if s.started_at else None,
                    "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                    "duration_seconds": dur_sec,
                    "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                    "attempts_used": s.attempts_used,
                    "max_attempts": s.max_attempts,
                    "guesses": [g.guess.upper() for g in s.guesses] if s.guesses else [],
                })

        # Calculations
        tot_unique_players = len(participation) if participation else sum(s.get("number_of_users", 0) for s in summaries_data)
        tot_games_started = sum(s.get("total_games", 0) for s in summaries_data)
        tot_won = sum(s.get("games_won", 0) for s in summaries_data)
        tot_lost = sum(s.get("games_lost", 0) for s in summaries_data)
        tot_expired = sum(s.get("games_expired", 0) for s in summaries_data)
        tot_active = sum(s.get("games_active", 0) for s in summaries_data)
        tot_completed = tot_won + tot_lost + tot_expired
        tot_guesses = sum(s.get("total_guesses", 0) for s in summaries_data)
        tot_correct_guesses = sum(s.get("number_of_correct_guesses", s.get("games_won", 0)) for s in summaries_data)

        completed_win_rate = round((tot_won / tot_completed * 100.0), 1) if tot_completed > 0 else 0.0
        overall_win_rate = round((tot_won / tot_games_started * 100.0), 1) if tot_games_started > 0 else 0.0

        period_label = "All Time"
        if target_date:
            period_label = target_date.strftime("%d %B %Y")
        elif start_date and end_date:
            if start_date == end_date:
                period_label = start_date.strftime("%d %B %Y")
            else:
                period_label = f"{start_date.strftime('%d %b %Y')} – {end_date.strftime('%d %b %Y')}"
        elif start_date:
            period_label = f"From {start_date.strftime('%d %b %Y')}"
        elif end_date:
            period_label = f"Until {end_date.strftime('%d %b %Y')}"

        tot_dist = tot_won + tot_lost + tot_expired + tot_active

        return {
            "period": {
                "target_date": target_date.isoformat() if target_date else None,
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
                "label": period_label,
            },
            "summary": {
                "active_players": tot_unique_players,
                "games_started": tot_games_started,
                "completed_matches": tot_completed,
                "active_sessions": tot_active,
                "victories": tot_won,
                "defeats_and_expired": tot_lost + tot_expired,
                "completed_win_rate": completed_win_rate,
                "overall_win_rate": overall_win_rate,
                "total_guesses": tot_guesses,
                "correct_guesses": tot_correct_guesses,
            },
            "outcome_distribution": {
                "won": {"count": tot_won, "percentage": round(tot_won / tot_dist * 100.0, 1) if tot_dist else 0.0},
                "lost": {"count": tot_lost, "percentage": round(tot_lost / tot_dist * 100.0, 1) if tot_dist else 0.0},
                "expired": {"count": tot_expired, "percentage": round(tot_expired / tot_dist * 100.0, 1) if tot_dist else 0.0},
                "active": {"count": tot_active, "percentage": round(tot_active / tot_dist * 100.0, 1) if tot_dist else 0.0},
            },
            "daily_summaries": [
                {
                    **s,
                    "date": s["date"].isoformat() if isinstance(s.get("date"), (date, datetime)) else str(s.get("date")),
                    "completed_win_rate": round(
                        (s.get("games_won", 0) / max(1, s.get("games_won", 0) + s.get("games_lost", 0) + s.get("games_expired", 0)) * 100.0),
                        1,
                    ) if (s.get("games_won", 0) + s.get("games_lost", 0) + s.get("games_expired", 0)) > 0 else 0.0,
                    "overall_win_rate": round(
                        (s.get("games_won", 0) / max(1, s.get("total_games", 0)) * 100.0),
                        1,
                    ) if s.get("total_games", 0) > 0 else 0.0,
                }
                for s in summaries_data
            ],
            "player_participation": participation,
            "word_statistics": word_stats,
            "sessions": sessions_list,
            "summary_only": summary_only,
        }

    async def get_player_report_dataset(
        self,
        player_identifier: str,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        summary_only: bool = False,
    ) -> Dict[str, Any]:
        """
        Aggregate and structure individual player performance report dataset for frontend rendering.
        """
        if start_date and end_date and start_date > end_date:
            raise AppException(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Start date cannot be after end date.",
            )

        # 0. Expire stale sessions
        await self.reports_repo.expire_stale_active_sessions()

        # 1. Resolve user profile
        user = None
        if self.user_repo:
            user = await self.user_repo.get_by_identifier(player_identifier)

        if not user:
            if str(player_identifier).isdigit():
                user_id = int(player_identifier)
                if self.user_repo:
                    user = await self.user_repo.get_by_id(user_id)
                username = user.username if user else f"User #{user_id}"
                role = user.role.value if user and hasattr(user.role, "value") else "PLAYER"
            else:
                raise AppException(
                    error_code=ErrorCode.NOT_FOUND,
                    message=f"Player '{player_identifier}' not found.",
                )
        else:
            user_id = user.id
            username = user.username
            role = user.role.value if hasattr(user.role, "value") else str(user.role)

        # 2. Lifetime statistics
        lifetime_stats = await self.reports_repo.get_player_lifetime_stats(user_id=user_id)

        # 3. Retrieve period user summaries (daily records)
        user_data, _ = await self.reports_repo.get_user_summaries(
            user_id=user_id,
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
            page=1,
            page_size=1000,
        )

        # 4. Period aggregates
        tot_games = sum(u.get("total_games", 0) for u in user_data)
        tot_won = sum(u.get("games_won", 0) for u in user_data)
        tot_guesses = sum(u.get("total_guesses", 0) for u in user_data)
        tot_corr_guesses = sum(u.get("correct_guesses", 0) for u in user_data)
        p_win_rate = round((tot_won / tot_games * 100.0), 1) if tot_games > 0 else 0.0

        period_stats = {
            "total_games": tot_games,
            "games_won": tot_won,
            "games_lost": max(0, tot_games - tot_won),
            "total_guesses": tot_guesses,
            "correct_guesses": tot_corr_guesses,
            "win_rate": p_win_rate,
        }

        # 5. Attempts distribution
        attempts_dist = await self.reports_repo.get_player_attempts_distribution(
            player_id=user_id,
            target_date=target_date,
            start_date=start_date,
            end_date=end_date,
        )

        # 6. Detailed match history (unless summary_only)
        sessions_list = []
        if not summary_only:
            raw_sessions = await self.reports_repo.get_period_sessions(
                target_date=target_date,
                start_date=start_date,
                end_date=end_date,
                player_id=user_id,
                limit=2000,
            )
            for s in raw_sessions:
                dur_sec = None
                if s.started_at and s.completed_at:
                    dur_sec = max(0, int((s.completed_at - s.started_at).total_seconds()))
                
                sessions_list.append({
                    "id": s.id,
                    "target_word": s.word.word.upper() if s.word else "N/A",
                    "started_at": s.started_at.isoformat() if s.started_at else None,
                    "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                    "duration_seconds": dur_sec,
                    "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                    "attempts_used": s.attempts_used,
                    "max_attempts": s.max_attempts,
                    "guesses": [g.guess.upper() for g in s.guesses] if s.guesses else [],
                })

        user_status = "Active"
        if user:
            if getattr(user, "is_deleted", False):
                user_status = "Deleted"
            elif getattr(user, "is_suspended", False):
                user_status = "Suspended"
            elif not getattr(user, "is_active", True):
                user_status = "Inactive"

        period_label = "All Time"
        if target_date:
            period_label = target_date.strftime("%d %B %Y")
        elif start_date and end_date:
            if start_date == end_date:
                period_label = start_date.strftime("%d %B %Y")
            else:
                period_label = f"{start_date.strftime('%d %b %Y')} – {end_date.strftime('%d %b %Y')}"
        elif start_date:
            period_label = f"From {start_date.strftime('%d %b %Y')}"
        elif end_date:
            period_label = f"Until {end_date.strftime('%d %b %Y')}"

        last_act = lifetime_stats.get("last_active_at")
        last_act_iso = last_act.isoformat() if isinstance(last_act, (date, datetime)) else (str(last_act) if last_act else None)

        return {
            "period": {
                "target_date": target_date.isoformat() if target_date else None,
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
                "label": period_label,
            },
            "user_profile": {
                "user_id": user_id,
                "username": username,
                "role": role,
                "status": user_status,
                "created_at": user.created_at.isoformat() if user and getattr(user, "created_at", None) else None,
                "last_active_at": last_act_iso,
            },
            "lifetime_stats": {
                **lifetime_stats,
                "last_active_at": last_act_iso,
            },
            "period_stats": period_stats,
            "attempts_distribution": attempts_dist,
            "daily_records": [
                {
                    **r,
                    "date": r["date"].isoformat() if isinstance(r.get("date"), (date, datetime)) else str(r.get("date")),
                }
                for r in user_data
            ],
            "sessions": sessions_list,
            "summary_only": summary_only,
        }
