"""Service for Admin User Management, Profile Insights, and Access Control."""

from datetime import datetime, timezone
from typing import List, Optional
from app.core.exceptions import AppException
from app.models.game_session import GameStatus
from app.models.user import UserRole
from app.repositories.game_session_repository import GameSessionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.admin_user import (
    UserListResponse,
    UserOverviewStatsResponse,
    UserStatsResponse,
)
from app.schemas.gameplay import GameHistoryItem, GameHistoryResponse, GameStateResponse, GuessItem
from app.services.audit_service import AuditService
from app.services.gameplay_service import compute_letter_feedback


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt



class AdminUserService:
    """Business logic service for administrator user management."""

    def __init__(
        self,
        user_repo: UserRepository,
        game_session_repo: GameSessionRepository,
        audit_service: AuditService,
    ) -> None:
        self.user_repo = user_repo
        self.game_session_repo = game_session_repo
        self.audit_service = audit_service

    async def get_overview_stats(self) -> UserOverviewStatsResponse:
        """Retrieve aggregated user counts and recent activity metrics."""
        stats = await self.user_repo.get_overview_stats()
        return UserOverviewStatsResponse(**stats)

    async def list_users(
        self,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = "newest",
        page: int = 1,
        page_size: int = 20,
    ) -> UserListResponse:
        """List paginated users with comprehensive gameplay metrics and sorting."""
        users, total = await self.user_repo.list_users(
            role=role,
            is_active=is_active,
            search=search,
            page=1, # Fetch matching rows to sort in memory if needed or paginated
            page_size=max(100, page_size),
        )

        user_items: List[UserStatsResponse] = []
        for u in users:
            stats = await self.user_repo.get_user_game_stats(u.id)
            user_items.append(
                UserStatsResponse(
                    id=u.id,
                    public_id=u.public_id,
                    username=u.username,
                    role=u.role,
                    is_active=u.is_active,
                    created_at=u.created_at,
                    updated_at=u.updated_at,
                    **stats,
                )
            )

        # Apply sorting
        if sort_by == "oldest":
            user_items.sort(key=lambda x: x.created_at)
        elif sort_by == "most_games":
            user_items.sort(key=lambda x: x.total_games, reverse=True)
        elif sort_by == "highest_win_rate":
            user_items.sort(key=lambda x: (x.win_rate, x.games_won), reverse=True)
        elif sort_by == "recent_activity":
            user_items.sort(
                key=lambda x: x.last_active_at or x.updated_at or x.created_at,
                reverse=True
            )
        else: # newest
            user_items.sort(key=lambda x: x.created_at, reverse=True)

        # Slice requested page
        start_idx = (page - 1) * page_size
        paginated_items = user_items[start_idx : start_idx + page_size]
        pages = (total + page_size - 1) // page_size if total > 0 else 1

        return UserListResponse(
            items=paginated_items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def get_user_details(self, identifier: str) -> UserStatsResponse:
        """Get comprehensive profile and metrics for a user by ID, public_id, or username."""
        user = await self.user_repo.get_by_identifier(identifier)
        if not user:
            raise AppException(status_code=404, message="User not found", error_code="USER_NOT_FOUND")

        stats = await self.user_repo.get_user_game_stats(user.id)
        return UserStatsResponse(
            id=user.id,
            public_id=user.public_id,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            **stats,
        )

    async def update_user_status(
        self,
        identifier: str,
        is_active: bool,
        admin_user_id: int,
        ip_address: Optional[str] = None,
    ) -> UserStatsResponse:
        """Block or unblock a user account and record an audit log entry."""
        user = await self.user_repo.get_by_identifier(identifier)
        if not user:
            raise AppException(status_code=404, message="User not found", error_code="USER_NOT_FOUND")

        # Prevent admin from blocking themselves
        if user.id == admin_user_id and not is_active:
            raise AppException(status_code=400, message="Administrators cannot block their own account", error_code="CANNOT_BLOCK_SELF")

        updated_user = await self.user_repo.update_status(user.id, is_active)

        action_type = "UNBLOCK_USER" if is_active else "BLOCK_USER"
        await self.audit_service.log_action(
            admin_user_id=admin_user_id,
            action=action_type,
            target_type="USER",
            target_id=str(user.id),
            description=f"{'Unblocked' if is_active else 'Blocked'} user '{user.username}' (Public ID: {user.public_id})",
            ip_address=ip_address,
        )

        stats = await self.user_repo.get_user_game_stats(updated_user.id)
        return UserStatsResponse(
            id=updated_user.id,
            public_id=updated_user.public_id,
            username=updated_user.username,
            role=updated_user.role,
            is_active=updated_user.is_active,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at,
            **stats,
        )

    async def get_user_game_history(
        self,
        identifier: str,
        status: Optional[GameStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> GameHistoryResponse:
        """Retrieve paginated match history for a given user for admin inspection."""
        user = await self.user_repo.get_by_identifier(identifier)
        if not user:
            raise AppException(status_code=404, message="User not found", error_code="USER_NOT_FOUND")

        sessions, total = await self.game_session_repo.list_player_sessions(
            player_id=user.id,
            status=status,
            page=page,
            page_size=page_size,
        )
        pages = (total + page_size - 1) // page_size if total > 0 else 1

        history_items = [
            GameHistoryItem(
                id=s.id,
                public_id=s.public_id,
                status=s.status,
                word_length=len(s.word.word),
                max_attempts=s.max_attempts,
                attempts_used=s.attempts_used,
                hints_used=s.hints_used,
                started_at=s.started_at,
                completed_at=s.completed_at,
                final_word=s.word.word if s.status != GameStatus.ACTIVE else None,
            )
            for s in sessions
        ]

        return GameHistoryResponse(
            items=history_items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def get_user_match_details(
        self,
        identifier: str,
        match_identifier: str,
    ) -> GameStateResponse:
        """
        Retrieve comprehensive match details and guess history for a user's game session
        for administrator inspection.
        """
        user = await self.user_repo.get_by_identifier(identifier)
        if not user:
            raise AppException(status_code=404, message="User not found", error_code="USER_NOT_FOUND")

        session = await self.game_session_repo.get_session_by_identifier(match_identifier)
        if not session or session.player_id != user.id:
            raise AppException(status_code=404, message="Match session not found for this user", error_code="MATCH_NOT_FOUND")

        word_text = session.word.word if session.word else ""
        word_length = len(word_text)
        final_word = word_text

        max_hints = session.settings_snapshot.get("max_hints", 0) if session.settings_snapshot else 0
        hints_remaining = max(0, max_hints - session.hints_used)
        revealed_hint = session.word.hint if session.word else None

        started_at = _ensure_utc(session.started_at)
        completed_at = _ensure_utc(session.completed_at)

        time_limit = session.settings_snapshot.get("time_limit_seconds") if session.settings_snapshot else None
        time_remaining = None
        if time_limit and time_limit > 0:
            now = datetime.now(timezone.utc)
            if session.status == GameStatus.ACTIVE:
                elapsed = (now - started_at).total_seconds() if started_at else 0
                time_remaining = max(0, int(time_limit - elapsed))
            else:
                time_remaining = 0

        guess_items = [
            GuessItem(
                guess=g.guess,
                is_correct=g.is_correct,
                attempt_number=g.attempt_number,
                created_at=_ensure_utc(g.created_at),
                letter_feedback=compute_letter_feedback(word_text, g.guess),
            )
            for g in (session.guesses or [])
        ]

        return GameStateResponse(
            id=session.id,
            public_id=session.public_id,
            status=session.status,
            word_length=word_length,
            masked_pattern=" ".join(list(word_text)) if word_text else "",
            max_attempts=session.max_attempts,
            attempts_used=session.attempts_used,
            remaining_attempts=max(0, session.max_attempts - session.attempts_used),
            max_hints=max_hints,
            hints_used=session.hints_used,
            hints_remaining=hints_remaining,
            revealed_hint=revealed_hint,
            guesses=guess_items,
            started_at=started_at,
            completed_at=completed_at,
            final_word=final_word,
            time_limit_seconds=time_limit,
            time_remaining_seconds=time_remaining,
        )

