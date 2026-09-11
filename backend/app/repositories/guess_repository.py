"""Repository for Guess database operations."""

from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.guess import Guess


class GuessRepository:
    """Encapsulates async database operations for Guess entities."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_guess(
        self,
        game_session_id: int,
        guess: str,
        is_correct: bool,
        attempt_number: int,
    ) -> Guess:
        """Create and persist a new guess attempt."""
        guess_entity = Guess(
            game_session_id=game_session_id,
            guess=guess,
            is_correct=is_correct,
            attempt_number=attempt_number,
        )
        self.session.add(guess_entity)
        await self.session.flush()
        await self.session.refresh(guess_entity)
        return guess_entity

    async def get_guesses_for_session(self, game_session_id: int) -> List[Guess]:
        """Fetch all guesses for a specific game session in chronological order."""
        statement = (
            select(Guess)
            .where(Guess.game_session_id == game_session_id)
            .order_by(Guess.attempt_number.asc())
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())
