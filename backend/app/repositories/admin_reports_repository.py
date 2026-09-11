"""Repository for Admin Daily and User Reporting queries."""

from datetime import date
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.game_session import GameSession, GameStatus
from app.models.guess import Guess
from app.models.user import User


class AdminReportsRepository:
    """Encapsulates async database aggregation and reporting operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_daily_summaries(
        self,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Aggregate gameplay metrics grouped by date.
        Uses separate session and guess aggregation subqueries to eliminate join row multiplication.
        """
        # Session metrics query
        session_date_col = func.date(GameSession.started_at).label("report_date")
        session_query = select(
            session_date_col,
            func.count(func.distinct(GameSession.player_id)).label("number_of_users"),
            func.count(func.distinct(GameSession.id)).label("total_games"),
            func.count(
                func.distinct(
                    case((GameSession.status == GameStatus.WON, GameSession.id), else_=None)
                )
            ).label("games_won"),
        ).group_by(session_date_col)

        if target_date is not None:
            session_query = session_query.where(session_date_col == target_date)
        if start_date is not None:
            session_query = session_query.where(session_date_col >= start_date)
        if end_date is not None:
            session_query = session_query.where(session_date_col <= end_date)

        session_result = await self.session.execute(session_query)
        session_rows = session_result.all()

        # Guess metrics query
        guess_date_col = func.date(Guess.created_at).label("report_date")
        guess_query = select(
            guess_date_col,
            func.count(Guess.id).label("total_guesses"),
            func.count(case((Guess.is_correct.is_(True), Guess.id), else_=None)).label("correct_guesses"),
        ).group_by(guess_date_col)

        if target_date is not None:
            guess_query = guess_query.where(guess_date_col == target_date)
        if start_date is not None:
            guess_query = guess_query.where(guess_date_col >= start_date)
        if end_date is not None:
            guess_query = guess_query.where(guess_date_col <= end_date)

        guess_result = await self.session.execute(guess_query)
        guess_rows = guess_result.all()

        # Build lookup maps
        guess_map: Dict[Any, Dict[str, int]] = {}
        for g in guess_rows:
            d = g.report_date
            # Normalise string date if sqlite/engine returned string
            if isinstance(d, str):
                d = date.fromisoformat(d)
            guess_map[d] = {
                "total_guesses": g.total_guesses or 0,
                "correct_guesses": g.correct_guesses or 0,
            }

        all_dates = set()
        session_map: Dict[Any, Dict[str, Any]] = {}
        for s in session_rows:
            d = s.report_date
            if isinstance(d, str):
                d = date.fromisoformat(d)
            all_dates.add(d)
            session_map[d] = {
                "number_of_users": s.number_of_users or 0,
                "total_games": s.total_games or 0,
                "games_won": s.games_won or 0,
            }

        for d in guess_map.keys():
            all_dates.add(d)

        # Sort dates descending
        sorted_dates = sorted(list(all_dates), reverse=True)
        total = len(sorted_dates)

        # Apply pagination
        offset = (page - 1) * page_size
        paged_dates = sorted_dates[offset : offset + page_size]

        summaries = []
        for d in paged_dates:
            s_data = session_map.get(d, {"number_of_users": 0, "total_games": 0, "games_won": 0})
            g_data = guess_map.get(d, {"total_guesses": 0, "correct_guesses": 0})
            total_games = s_data["total_games"]
            games_won = s_data["games_won"]
            win_rate = round((games_won / total_games * 100.0), 1) if total_games > 0 else 0.0

            summaries.append({
                "date": d,
                "number_of_users": s_data["number_of_users"],
                "total_games": total_games,
                "games_won": games_won,
                "number_of_correct_guesses": g_data["correct_guesses"],
                "total_guesses": g_data["total_guesses"],
                "win_rate": win_rate,
            })

        return summaries, total

    async def get_daily_details(
        self,
        target_date: date,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[GameSession], int]:
        """Fetch game session details for a single target date with eager loaded relations."""
        session_date_col = func.date(GameSession.started_at)
        
        # Count total
        count_query = select(func.count(GameSession.id)).where(session_date_col == target_date)
        total_res = await self.session.execute(count_query)
        total = total_res.scalar_one() or 0

        # Query sessions
        offset = (page - 1) * page_size
        query = (
            select(GameSession)
            .options(
                selectinload(GameSession.player),
                selectinload(GameSession.word),
                selectinload(GameSession.guesses),
            )
            .where(session_date_col == target_date)
            .order_by(GameSession.started_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await self.session.execute(query)
        sessions = list(result.scalars().all())
        return sessions, total

    async def get_user_summaries(
        self,
        user_id: Optional[int] = None,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Aggregate user performance metrics grouped by (player_id, date).
        """
        session_date_col = func.date(GameSession.started_at).label("report_date")
        session_query = (
            select(
                GameSession.player_id,
                User.username,
                session_date_col,
                func.count(func.distinct(GameSession.id)).label("total_games"),
                func.count(
                    func.distinct(
                        case((GameSession.status == GameStatus.WON, GameSession.id), else_=None)
                    )
                ).label("games_won"),
            )
            .join(User, GameSession.player_id == User.id)
            .group_by(GameSession.player_id, User.username, session_date_col)
        )

        if user_id is not None:
            session_query = session_query.where(GameSession.player_id == user_id)
        if target_date is not None:
            session_query = session_query.where(session_date_col == target_date)
        if start_date is not None:
            session_query = session_query.where(session_date_col >= start_date)
        if end_date is not None:
            session_query = session_query.where(session_date_col <= end_date)

        session_result = await self.session.execute(session_query)
        session_rows = session_result.all()

        # Guess metrics query joined to GameSession
        guess_query = (
            select(
                GameSession.player_id,
                session_date_col,
                func.count(Guess.id).label("total_guesses"),
                func.count(case((Guess.is_correct.is_(True), Guess.id), else_=None)).label("correct_guesses"),
            )
            .join(GameSession, Guess.game_session_id == GameSession.id)
            .group_by(GameSession.player_id, session_date_col)
        )

        if user_id is not None:
            guess_query = guess_query.where(GameSession.player_id == user_id)
        if target_date is not None:
            guess_query = guess_query.where(session_date_col == target_date)
        if start_date is not None:
            guess_query = guess_query.where(session_date_col >= start_date)
        if end_date is not None:
            guess_query = guess_query.where(session_date_col <= end_date)

        guess_result = await self.session.execute(guess_query)
        guess_rows = guess_result.all()

        guess_map: Dict[Tuple[int, Any], Dict[str, int]] = {}
        for g in guess_rows:
            d = g.report_date
            if isinstance(d, str):
                d = date.fromisoformat(d)
            guess_map[(g.player_id, d)] = {
                "total_guesses": g.total_guesses or 0,
                "correct_guesses": g.correct_guesses or 0,
            }

        entries = []
        for s in session_rows:
            d = s.report_date
            if isinstance(d, str):
                d = date.fromisoformat(d)
            key = (s.player_id, d)
            g_data = guess_map.get(key, {"total_guesses": 0, "correct_guesses": 0})
            total_games = s.total_games or 0
            games_won = s.games_won or 0
            win_rate = round((games_won / total_games * 100.0), 1) if total_games > 0 else 0.0

            entries.append({
                "user_id": s.player_id,
                "username": s.username,
                "date": d,
                "words_tried": total_games,
                "total_games": total_games,
                "games_won": games_won,
                "correct_guesses": g_data["correct_guesses"],
                "total_guesses": g_data["total_guesses"],
                "win_rate": win_rate,
            })

        # Sort by date desc, username asc
        entries.sort(key=lambda x: (x["date"], x["username"]), reverse=True)
        total = len(entries)

        offset = (page - 1) * page_size
        paged_entries = entries[offset : offset + page_size]

        return paged_entries, total
