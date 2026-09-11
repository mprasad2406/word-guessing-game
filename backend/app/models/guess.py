"""SQLAlchemy model for Guess entity."""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.game_session import GameSession


class Guess(Base):
    """Guess attempt database model."""

    __tablename__ = "guesses"
    __table_args__ = (
        UniqueConstraint("game_session_id", "attempt_number", name="uq_game_session_attempt"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )
    game_session_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("game_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    guess: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    is_correct: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )
    attempt_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    game_session: Mapped["GameSession"] = relationship("GameSession", back_populates="guesses")

    def __repr__(self) -> str:
        return (
            f"<Guess(id={self.id}, game_session_id={self.game_session_id}, "
            f"guess='{self.guess}', is_correct={self.is_correct}, attempt={self.attempt_number})>"
        )
