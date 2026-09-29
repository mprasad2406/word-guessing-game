from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.game_session import GameSession, GameStatus
from app.models.guess import Guess
from app.models.user import User
from app.models.word import Word


class AdminReportsRepository:
    """Encapsulates async database aggregation and reporting operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def expire_stale_active_sessions(self) -> int:
        """
        Check all ACTIVE sessions in DB and mark any that exceeded their configured time_limit_seconds as EXPIRED.
        Returns the count of expired sessions.
        """
        query = select(GameSession).where(GameSession.status == GameStatus.ACTIVE)
        res = await self.session.execute(query)
        active_sessions = list(res.scalars().all())
        now = datetime.now(timezone.utc)
        expired_count = 0

        for session in active_sessions:
            time_limit = session.settings_snapshot.get("time_limit_seconds") if session.settings_snapshot else None
            if time_limit and time_limit > 0 and session.started_at:
                started_at = session.started_at
                if started_at.tzinfo is None:
                    started_at = started_at.replace(tzinfo=timezone.utc)
                elapsed = (now - started_at).total_seconds()
                if elapsed > time_limit:
                    session.status = GameStatus.EXPIRED
                    session.completed_at = started_at + timedelta(seconds=time_limit)
                    expired_count += 1

        if expired_count > 0:
            await self.session.commit()

        return expired_count

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
        session_date_expr = func.date(GameSession.started_at)
        session_query = select(
            session_date_expr.label("report_date"),
            func.count(func.distinct(GameSession.player_id)).label("number_of_users"),
            func.count(func.distinct(GameSession.id)).label("total_games"),
            func.count(
                func.distinct(
                    case((GameSession.status == GameStatus.WON, GameSession.id), else_=None)
                )
            ).label("games_won"),
            func.count(
                func.distinct(
                    case((GameSession.status == GameStatus.LOST, GameSession.id), else_=None)
                )
            ).label("games_lost"),
            func.count(
                func.distinct(
                    case((GameSession.status == GameStatus.EXPIRED, GameSession.id), else_=None)
                )
            ).label("games_expired"),
            func.count(
                func.distinct(
                    case((GameSession.status == GameStatus.ACTIVE, GameSession.id), else_=None)
                )
            ).label("games_active"),
        ).group_by(session_date_expr)

        if target_date is not None:
            session_query = session_query.where(session_date_expr == target_date)
        if start_date is not None:
            session_query = session_query.where(session_date_expr >= start_date)
        if end_date is not None:
            session_query = session_query.where(session_date_expr <= end_date)

        session_result = await self.session.execute(session_query)
        session_rows = session_result.all()

        # Guess metrics query
        guess_date_expr = func.date(Guess.created_at)
        guess_query = select(
            guess_date_expr.label("report_date"),
            func.count(Guess.id).label("total_guesses"),
            func.count(case((Guess.is_correct.is_(True), Guess.id), else_=None)).label("correct_guesses"),
        ).group_by(guess_date_expr)

        if target_date is not None:
            guess_query = guess_query.where(guess_date_expr == target_date)
        if start_date is not None:
            guess_query = guess_query.where(guess_date_expr >= start_date)
        if end_date is not None:
            guess_query = guess_query.where(guess_date_expr <= end_date)

        guess_result = await self.session.execute(guess_query)
        guess_rows = guess_result.all()

        # Build lookup maps
        guess_map: Dict[Any, Dict[str, int]] = {}
        for g in guess_rows:
            d = g.report_date
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
                "games_lost": s.games_lost or 0,
                "games_expired": s.games_expired or 0,
                "games_active": s.games_active or 0,
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
            s_data = session_map.get(
                d,
                {
                    "number_of_users": 0,
                    "total_games": 0,
                    "games_won": 0,
                    "games_lost": 0,
                    "games_expired": 0,
                    "games_active": 0,
                },
            )
            g_data = guess_map.get(d, {"total_guesses": 0, "correct_guesses": 0})
            total_games = s_data["total_games"]
            games_won = s_data["games_won"]
            win_rate = round((games_won / total_games * 100.0), 1) if total_games > 0 else 0.0

            summaries.append({
                "date": d,
                "number_of_users": s_data["number_of_users"],
                "total_games": total_games,
                "games_won": games_won,
                "games_lost": s_data["games_lost"],
                "games_expired": s_data["games_expired"],
                "games_active": s_data["games_active"],
                "number_of_correct_guesses": games_won,
                "total_guesses": g_data["total_guesses"],
                "win_rate": win_rate,
            })

        return summaries, total

    async def get_daily_details(
        self,
        target_date: date,
        status: Optional[GameStatus] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Tuple[List[GameSession], int]:
        """Fetch game session details for a single target date with eager loaded relations and optional filters."""
        session_date_expr = func.date(GameSession.started_at)
        
        base_query = (
            select(GameSession)
            .join(User, GameSession.player_id == User.id)
            .where(session_date_expr == target_date)
        )

        if status is not None:
            base_query = base_query.where(GameSession.status == status)
        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            base_query = base_query.where(func.lower(User.username).like(term))

        # Count total
        subq = base_query.subquery()
        count_query = select(func.count()).select_from(subq)
        total_res = await self.session.execute(count_query)
        total = total_res.scalar_one() or 0

        # Query sessions
        offset = (page - 1) * page_size
        query = (
            base_query
            .options(
                selectinload(GameSession.player),
                selectinload(GameSession.word),
                selectinload(GameSession.guesses),
            )
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
        session_date_expr = func.date(GameSession.started_at)
        session_query = (
            select(
                GameSession.player_id,
                User.public_id.label("player_public_id"),
                User.username,
                session_date_expr.label("report_date"),
                func.count(func.distinct(GameSession.id)).label("total_games"),
                func.count(
                    func.distinct(
                        case((GameSession.status == GameStatus.WON, GameSession.id), else_=None)
                    )
                ).label("games_won"),
            )
            .join(User, GameSession.player_id == User.id)
            .group_by(GameSession.player_id, User.public_id, User.username, session_date_expr)
        )

        if user_id is not None:
            session_query = session_query.where(GameSession.player_id == user_id)
        if target_date is not None:
            session_query = session_query.where(session_date_expr == target_date)
        if start_date is not None:
            session_query = session_query.where(session_date_expr >= start_date)
        if end_date is not None:
            session_query = session_query.where(session_date_expr <= end_date)

        session_result = await self.session.execute(session_query)
        session_rows = session_result.all()

        # Guess metrics query joined to GameSession
        guess_date_expr = func.date(Guess.created_at)
        guess_query = (
            select(
                GameSession.player_id,
                guess_date_expr.label("report_date"),
                func.count(Guess.id).label("total_guesses"),
                func.count(case((Guess.is_correct.is_(True), Guess.id), else_=None)).label("correct_guesses"),
            )
            .join(GameSession, Guess.game_session_id == GameSession.id)
            .group_by(GameSession.player_id, guess_date_expr)
        )

        if user_id is not None:
            guess_query = guess_query.where(GameSession.player_id == user_id)
        if target_date is not None:
            guess_query = guess_query.where(guess_date_expr == target_date)
        if start_date is not None:
            guess_query = guess_query.where(guess_date_expr >= start_date)
        if end_date is not None:
            guess_query = guess_query.where(guess_date_expr <= end_date)

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
                "player_public_id": str(s.player_public_id) if s.player_public_id else None,
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

    async def get_player_participation_summaries(
        self,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """
        Aggregate full player participation for a reporting period across all players.
        Returns per-player words tried, correct guesses, total guesses, victories, losses, expired, active, and win rate.
        """
        session_date_expr = func.date(GameSession.started_at)
        session_query = (
            select(
                GameSession.player_id,
                User.username,
                User.role,
                func.count(func.distinct(GameSession.id)).label("words_tried"),
                func.count(
                    func.distinct(
                        case((GameSession.status == GameStatus.WON, GameSession.id), else_=None)
                    )
                ).label("victories"),
                func.count(
                    func.distinct(
                        case((GameSession.status == GameStatus.LOST, GameSession.id), else_=None)
                    )
                ).label("losses"),
                func.count(
                    func.distinct(
                        case((GameSession.status == GameStatus.EXPIRED, GameSession.id), else_=None)
                    )
                ).label("expired"),
                func.count(
                    func.distinct(
                        case((GameSession.status == GameStatus.ACTIVE, GameSession.id), else_=None)
                    )
                ).label("active"),
            )
            .join(User, GameSession.player_id == User.id)
            .group_by(GameSession.player_id, User.username, User.role)
        )

        if target_date is not None:
            session_query = session_query.where(session_date_expr == target_date)
        if start_date is not None:
            session_query = session_query.where(session_date_expr >= start_date)
        if end_date is not None:
            session_query = session_query.where(session_date_expr <= end_date)

        session_res = await self.session.execute(session_query)
        session_rows = session_res.all()

        # Guess count per player
        guess_date_expr = func.date(Guess.created_at)
        guess_query = (
            select(
                GameSession.player_id,
                func.count(Guess.id).label("total_guesses"),
                func.count(case((Guess.is_correct.is_(True), Guess.id), else_=None)).label("correct_guesses"),
            )
            .join(GameSession, Guess.game_session_id == GameSession.id)
            .group_by(GameSession.player_id)
        )

        if target_date is not None:
            guess_query = guess_query.where(guess_date_expr == target_date)
        if start_date is not None:
            guess_query = guess_query.where(guess_date_expr >= start_date)
        if end_date is not None:
            guess_query = guess_query.where(guess_date_expr <= end_date)

        guess_res = await self.session.execute(guess_query)
        guess_map = {row.player_id: (row.total_guesses or 0, row.correct_guesses or 0) for row in guess_res.all()}

        results = []
        for s in session_rows:
            tot_guesses, corr_guesses = guess_map.get(s.player_id, (0, 0))
            words_tried = s.words_tried or 0
            victories = s.victories or 0
            losses = s.losses or 0
            expired = s.expired or 0
            active = s.active or 0
            completed = victories + losses + expired
            completed_win_rate = round((victories / completed * 100.0), 1) if completed > 0 else 0.0
            overall_win_rate = round((victories / words_tried * 100.0), 1) if words_tried > 0 else 0.0

            results.append({
                "player_id": s.player_id,
                "username": s.username,
                "role": s.role.value if hasattr(s.role, "value") else str(s.role),
                "words_tried": words_tried,
                "victories": victories,
                "losses": losses,
                "expired": expired,
                "active": active,
                "correct_guesses": victories,
                "total_guesses": tot_guesses,
                "win_rate": overall_win_rate,
                "completed_win_rate": completed_win_rate,
                "overall_win_rate": overall_win_rate,
            })

        results.sort(key=lambda x: (x["words_tried"], x["victories"]), reverse=True)
        return results

    async def get_word_statistics(
        self,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """
        Aggregate target word statistics attempted during the reporting period.
        Returns target word, frequency, successful/unsuccessful sessions, average attempts, and success rate.
        """
        session_date_expr = func.date(GameSession.started_at)
        query = (
            select(
                Word.id.label("word_id"),
                Word.word,
                func.count(GameSession.id).label("frequency"),
                func.count(
                    case((GameSession.status == GameStatus.WON, GameSession.id), else_=None)
                ).label("successful"),
                func.count(
                    case((GameSession.status.in_([GameStatus.LOST, GameStatus.EXPIRED]), GameSession.id), else_=None)
                ).label("unsuccessful"),
                func.avg(
                    case((GameSession.status == GameStatus.WON, GameSession.attempts_used), else_=None)
                ).label("avg_attempts"),
            )
            .join(Word, GameSession.word_id == Word.id)
            .group_by(Word.id, Word.word)
        )

        if target_date is not None:
            query = query.where(session_date_expr == target_date)
        if start_date is not None:
            query = query.where(session_date_expr >= start_date)
        if end_date is not None:
            query = query.where(session_date_expr <= end_date)

        result = await self.session.execute(query)
        rows = result.all()

        word_stats = []
        for r in rows:
            freq = r.frequency or 0
            succ = r.successful or 0
            unsucc = r.unsuccessful or 0
            completed = succ + unsucc
            active = max(0, freq - completed)
            avg_att = round(float(r.avg_attempts), 1) if r.avg_attempts is not None else None
            completed_succ_rate = round((succ / completed * 100.0), 1) if completed > 0 else 0.0
            overall_succ_rate = round((succ / freq * 100.0), 1) if freq > 0 else 0.0

            word_stats.append({
                "word_id": r.word_id,
                "word": r.word,
                "frequency": freq,
                "successful": succ,
                "unsuccessful": unsucc,
                "active": active,
                "avg_attempts": avg_att,
                "success_rate": overall_succ_rate,
                "completed_success_rate": completed_succ_rate,
                "overall_success_rate": overall_succ_rate,
            })

        word_stats.sort(key=lambda x: (x["frequency"], x["successful"]), reverse=True)
        return word_stats

    async def get_period_sessions(
        self,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        player_id: Optional[int] = None,
        limit: int = 2000,
    ) -> List[GameSession]:
        """
        Fetch all game sessions within the period with eager-loaded player, word, and chronological guesses.
        """
        session_date_expr = func.date(GameSession.started_at)
        query = (
            select(GameSession)
            .join(User, GameSession.player_id == User.id)
            .join(Word, GameSession.word_id == Word.id)
            .options(
                selectinload(GameSession.player),
                selectinload(GameSession.word),
                selectinload(GameSession.guesses),
            )
            .order_by(GameSession.started_at.desc())
            .limit(limit)
        )

        if player_id is not None:
            query = query.where(GameSession.player_id == player_id)
        if target_date is not None:
            query = query.where(session_date_expr == target_date)
        if start_date is not None:
            query = query.where(session_date_expr >= start_date)
        if end_date is not None:
            query = query.where(session_date_expr <= end_date)

        result = await self.session.execute(query)
        sessions = list(result.scalars().all())

        # Sort guesses chronologically per session
        for s in sessions:
            if s.guesses:
                s.guesses.sort(key=lambda g: g.created_at)

        return sessions

    async def get_player_lifetime_stats(
        self,
        player_id: Optional[int] = None,
        user_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Compute player's complete lifetime metrics: total games, wins, losses, expired, active,
        total guesses, avg attempts, win rate, max win streak, current streak, and last active timestamp.
        """
        pid = player_id if player_id is not None else user_id
        if pid is None:
            raise ValueError("player_id or user_id must be provided")

        # Session metrics
        session_query = select(
            func.count(GameSession.id).label("total_games"),
            func.count(case((GameSession.status == GameStatus.WON, GameSession.id), else_=None)).label("games_won"),
            func.count(case((GameSession.status == GameStatus.LOST, GameSession.id), else_=None)).label("games_lost"),
            func.count(case((GameSession.status == GameStatus.EXPIRED, GameSession.id), else_=None)).label("games_expired"),
            func.count(case((GameSession.status == GameStatus.ACTIVE, GameSession.id), else_=None)).label("games_active"),
            func.avg(case((GameSession.status == GameStatus.WON, GameSession.attempts_used), else_=None)).label("avg_attempts"),
            func.max(GameSession.started_at).label("last_started_at"),
            func.max(GameSession.completed_at).label("last_completed_at"),
        ).where(GameSession.player_id == pid)

        s_res = await self.session.execute(session_query)
        s_row = s_res.one()

        # Guess metrics
        guess_query = select(
            func.count(Guess.id).label("total_guesses"),
            func.count(case((Guess.is_correct.is_(True), Guess.id), else_=None)).label("correct_guesses"),
        ).join(GameSession, Guess.game_session_id == GameSession.id).where(GameSession.player_id == pid)

        g_res = await self.session.execute(guess_query)
        g_row = g_res.one()

        # Streaks calculation
        streak_query = (
            select(GameSession.status)
            .where((GameSession.player_id == pid) & (GameSession.status != GameStatus.ACTIVE))
            .order_by(GameSession.started_at.desc())
        )
        streak_res = await self.session.execute(streak_query)
        statuses = [r[0] for r in streak_res.fetchall()]

        current_streak = 0
        for st in statuses:
            if st == GameStatus.WON:
                current_streak += 1
            else:
                break

        max_streak = 0
        temp_streak = 0
        # In chronological order for max streak
        for st in reversed(statuses):
            if st == GameStatus.WON:
                temp_streak += 1
                if temp_streak > max_streak:
                    max_streak = temp_streak
            else:
                temp_streak = 0

        tot_games = s_row.total_games or 0
        won = s_row.games_won or 0
        completed = won + (s_row.games_lost or 0) + (s_row.games_expired or 0)
        win_rate = round((won / tot_games * 100.0), 1) if tot_games > 0 else 0.0
        avg_att = round(float(s_row.avg_attempts), 1) if s_row.avg_attempts is not None else None
        last_active = s_row.last_completed_at or s_row.last_started_at

        return {
            "total_games": tot_games,
            "games_won": won,
            "games_lost": s_row.games_lost or 0,
            "games_expired": s_row.games_expired or 0,
            "games_active": s_row.games_active or 0,
            "total_guesses": g_row.total_guesses or 0,
            "correct_guesses": g_row.correct_guesses or 0,
            "win_rate": win_rate,
            "average_attempts": avg_att,
            "current_streak": current_streak,
            "max_streak": max_streak,
            "last_active_at": last_active,
        }

    async def get_player_attempts_distribution(
        self,
        player_id: Optional[int] = None,
        user_id: Optional[int] = None,
        target_date: Optional[date] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, int]:
        """
        Calculate the count of games solved on attempt 1, 2, 3, 4, 5, and >5 for a player.
        """
        pid = player_id if player_id is not None else user_id
        if pid is None:
            raise ValueError("player_id or user_id must be provided")

        session_date_expr = func.date(GameSession.started_at)
        query = (
            select(
                GameSession.attempts_used,
                func.count(GameSession.id).label("count"),
            )
            .where(
                (GameSession.player_id == pid)
                & (GameSession.status == GameStatus.WON)
            )
            .group_by(GameSession.attempts_used)
        )

        if target_date is not None:
            query = query.where(session_date_expr == target_date)
        if start_date is not None:
            query = query.where(session_date_expr >= start_date)
        if end_date is not None:
            query = query.where(session_date_expr <= end_date)

        result = await self.session.execute(query)
        rows = result.all()

        dist = {
            "attempt_1": 0,
            "attempt_2": 0,
            "attempt_3": 0,
            "attempt_4": 0,
            "attempt_5": 0,
            "attempt_gt5": 0,
        }

        for r in rows:
            att = r.attempts_used
            cnt = r.count or 0
            if att == 1:
                dist["attempt_1"] += cnt
            elif att == 2:
                dist["attempt_2"] += cnt
            elif att == 3:
                dist["attempt_3"] += cnt
            elif att == 4:
                dist["attempt_4"] += cnt
            elif att == 5:
                dist["attempt_5"] += cnt
            elif att > 5:
                dist["attempt_gt5"] += cnt

        return dist

