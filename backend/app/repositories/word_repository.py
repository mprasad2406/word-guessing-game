"""Repository for Word database operations."""

from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game_session import GameSession, GameStatus
from app.models.word import DifficultyLevel, Word


class WordRepository:
    """Encapsulates async database operations for Word entities."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, word_id: int) -> Optional[Word]:
        """Fetch a word by primary key ID."""
        statement = select(Word).where(Word.id == word_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_by_word(self, word: str) -> Optional[Word]:
        """Fetch a word by string value."""
        statement = select(Word).where(Word.word == word)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def exists_by_word(self, word: str) -> bool:
        """Check whether a word already exists."""
        word_entity = await self.get_by_word(word)
        return word_entity is not None

    async def list_words(
        self,
        is_active: Optional[bool] = None,
        difficulty: Optional[DifficultyLevel] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Word], int]:
        """List words with optional filtering and pagination."""
        query = select(Word)
        count_query = select(func.count(Word.id))

        if is_active is not None:
            query = query.where(Word.is_active == is_active)
            count_query = count_query.where(Word.is_active == is_active)

        if difficulty is not None:
            query = query.where(Word.difficulty == difficulty)
            count_query = count_query.where(Word.difficulty == difficulty)

        # Count total
        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        # Fetch page
        offset = (page - 1) * page_size
        query = query.order_by(Word.id.desc()).offset(offset).limit(page_size)
        items_result = await self.session.execute(query)
        items = list(items_result.scalars().all())

        return items, total

    async def create(
        self,
        word: str,
        hint: Optional[str],
        difficulty: DifficultyLevel,
        is_active: bool,
        created_by: int,
    ) -> Word:
        """Create and persist a new Word entity."""
        word_entity = Word(
            word=word,
            hint=hint,
            difficulty=difficulty,
            is_active=is_active,
            created_by=created_by,
        )
        self.session.add(word_entity)
        await self.session.flush()
        await self.session.refresh(word_entity)
        return word_entity

    async def update(
        self,
        word_entity: Word,
        word: Optional[str] = None,
        hint: Optional[str] = None,
        difficulty: Optional[DifficultyLevel] = None,
        is_active: Optional[bool] = None,
    ) -> Word:
        """Update an existing Word entity."""
        if word is not None:
            word_entity.word = word
        if hint is not None:
            word_entity.hint = hint
        if difficulty is not None:
            word_entity.difficulty = difficulty
        if is_active is not None:
            word_entity.is_active = is_active

        await self.session.flush()
        await self.session.refresh(word_entity)
        return word_entity

    async def get_word_usage_stats(self, word_id: int) -> Dict[str, Any]:
        """Calculate gameplay usage metrics for a word."""
        statement = select(
            func.count(GameSession.id).label("appearances"),
            func.coalesce(func.sum(case((GameSession.status == GameStatus.WON, 1), else_=0)), 0).label("won_count"),
            func.avg(GameSession.attempts_used).label("avg_attempts"),
        ).where(GameSession.word_id == word_id)
        result = await self.session.execute(statement)
        row = result.first()
        if not row or not row.appearances:
            return {"appearance_count": 0, "solve_rate": None, "average_attempts": None}

        appearances = row.appearances or 0
        won_count = row.won_count or 0
        solve_rate = round((won_count / appearances) * 100, 1) if appearances > 0 else None
        avg_attempts = round(float(row.avg_attempts), 1) if row.avg_attempts else None
        return {
            "appearance_count": appearances,
            "solve_rate": solve_rate,
            "average_attempts": avg_attempts,
        }

    async def count_game_sessions_referencing_word(self, word_id: int) -> int:
        """Count the number of game sessions currently referencing this word."""
        statement = select(func.count(GameSession.id)).where(GameSession.word_id == word_id)
        result = await self.session.execute(statement)
        return result.scalar_one()

    async def delete_permanent(self, word_entity: Word) -> None:
        """Permanently remove a Word entity from the database."""
        await self.session.delete(word_entity)
        await self.session.flush()
