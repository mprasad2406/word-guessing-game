import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.game_session import GameSession, GameStatus
from app.models.word import DifficultyLevel, Word


class GameSessionRepository:
    """Encapsulates async database operations for GameSession entities."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_player_recent_sessions(self, player_id: int, limit: int = 5) -> List[GameSession]:
        """Fetch the player's recent completed or attempted game sessions."""
        query = (
            select(GameSession)
            .where(
                GameSession.player_id == player_id,
                GameSession.status != GameStatus.ACTIVE,
            )
            .order_by(GameSession.id.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def find_eligible_word(
        self,
        min_len: int,
        max_len: int,
        difficulty: Optional[DifficultyLevel],
        allow_reuse: bool,
        player_id: int,
    ) -> Optional[Word]:
        """
        Adaptive word selection based on player performance and history:
        1. Selects active words within configured length constraints.
        2. Filters by target adaptive difficulty (EASY, MEDIUM, HARD).
        3. If target difficulty unplayed pool is exhausted, gracefully falls back across difficulty tiers.
        4. Prioritizes unplayed words and prevents frequent repeats using recency/frequency tracking.
        """
        base_filters = [
            Word.is_active.is_(True),
            func.length(Word.word) >= min_len,
            func.length(Word.word) <= max_len,
        ]

        # Fetch all active words matching length constraints
        all_query = select(Word).where(*base_filters)
        all_result = await self.session.execute(all_query)
        all_eligible_words = list(all_result.scalars().all())

        if not all_eligible_words:
            return None

        if len(all_eligible_words) == 1:
            return all_eligible_words[0]

        # Query player's word history
        history_query = (
            select(
                GameSession.word_id,
                func.count(GameSession.id).label("play_count"),
                func.max(GameSession.started_at).label("last_played_at"),
                func.max(GameSession.id).label("last_session_id"),
            )
            .where(GameSession.player_id == player_id)
            .group_by(GameSession.word_id)
        )
        history_result = await self.session.execute(history_query)
        history_rows = history_result.all()

        word_history: Dict[int, Dict[str, Any]] = {}
        last_played_word_id: Optional[int] = None
        max_session_id = -1

        for row in history_rows:
            last_sess_id = row.last_session_id or 0
            if last_sess_id > max_session_id:
                max_session_id = last_sess_id
                last_played_word_id = row.word_id

            word_history[row.word_id] = {
                "play_count": row.play_count or 0,
                "last_played_at": row.last_played_at,
                "last_session_id": last_sess_id,
            }

        # Filter by difficulty tier if specified
        target_tier_words = [w for w in all_eligible_words if w.difficulty == difficulty] if difficulty else all_eligible_words

        # Check for unplayed words in target tier
        unplayed_in_tier = [w for w in target_tier_words if w.id not in word_history or word_history[w.id]["play_count"] == 0]
        if unplayed_in_tier:
            candidates = [w for w in unplayed_in_tier if w.id != last_played_word_id] or unplayed_in_tier
            return random.choice(candidates)

        # If target tier unplayed is empty, check unplayed in all eligible words
        unplayed_all = [w for w in all_eligible_words if w.id not in word_history or word_history[w.id]["play_count"] == 0]
        if unplayed_all:
            candidates = [w for w in unplayed_all if w.id != last_played_word_id] or unplayed_all
            return random.choice(candidates)

        if not allow_reuse:
            return None

        # All words played: pick least frequently and least recently played from target tier or all
        candidate_pool_source = target_tier_words if target_tier_words else all_eligible_words
        available_pool = [w for w in candidate_pool_source if w.id != last_played_word_id] or candidate_pool_source

        min_play_count = min(word_history.get(w.id, {}).get("play_count", 0) for w in available_pool)
        least_played_words = [
            w for w in available_pool
            if word_history.get(w.id, {}).get("play_count", 0) == min_play_count
        ]

        least_played_words.sort(
            key=lambda w: (
                word_history.get(w.id, {}).get("last_session_id", 0),
                word_history.get(w.id, {}).get("last_played_at") or datetime.min,
            )
        )

        pool_size = max(1, len(least_played_words) // 2) if len(least_played_words) > 2 else len(least_played_words)
        final_candidates = least_played_words[:pool_size]

        return random.choice(final_candidates)

    async def create_session(
        self,
        player_id: int,
        word_id: int,
        max_attempts: int,
        settings_snapshot: Dict[str, Any],
    ) -> GameSession:
        """Create and initialize a new GameSession."""
        session_entity = GameSession(
            player_id=player_id,
            word_id=word_id,
            status=GameStatus.ACTIVE,
            max_attempts=max_attempts,
            attempts_used=0,
            hints_used=0,
            hint_revealed=False,
            settings_snapshot=settings_snapshot,
            started_at=datetime.now(timezone.utc),
        )
        self.session.add(session_entity)
        await self.session.flush()
        await self.session.refresh(session_entity, attribute_names=["word", "guesses"])
        return session_entity

    async def get_session_by_id(
        self,
        session_id: int,
        for_update: bool = False,
    ) -> Optional[GameSession]:
        """
        Retrieve a game session by ID with word and guesses preloaded.
        Supports row-level locking for atomic gameplay transactions.
        """
        query = (
            select(GameSession)
            .where(GameSession.id == session_id)
            .options(
                selectinload(GameSession.word),
                selectinload(GameSession.guesses),
            )
        )
        if for_update:
            query = query.with_for_update()

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_player_sessions(
        self,
        player_id: int,
        status: Optional[GameStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[GameSession], int]:
        """Retrieve paginated game history for a specific player."""
        query = (
            select(GameSession)
            .where(GameSession.player_id == player_id)
            .options(selectinload(GameSession.word))
        )
        count_query = (
            select(func.count(GameSession.id))
            .where(GameSession.player_id == player_id)
        )

        if status is not None:
            query = query.where(GameSession.status == status)
            count_query = count_query.where(GameSession.status == status)

        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        query = query.order_by(GameSession.started_at.desc()).offset(offset).limit(page_size)
        items_result = await self.session.execute(query)
        items = list(items_result.scalars().all())

        return items, total

    async def get_active_sessions_for_player(self, player_id: int) -> List[GameSession]:
        """Retrieve all active game sessions for a player."""
        query = (
            select(GameSession)
            .where(
                GameSession.player_id == player_id,
                GameSession.status == GameStatus.ACTIVE,
            )
            .options(selectinload(GameSession.word))
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_player_games_today(self, player_id: int) -> int:
        """Count the number of game sessions started by a player today (UTC calendar day)."""
        now = datetime.now(timezone.utc)
        today = now.date()
        start_of_day = datetime(today.year, today.month, today.day, 0, 0, 0, tzinfo=timezone.utc)
        end_of_day = start_of_day + timedelta(days=1)
        query = (
            select(func.count(GameSession.id))
            .where(
                GameSession.player_id == player_id,
                GameSession.started_at >= start_of_day,
                GameSession.started_at < end_of_day,
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one() or 0
