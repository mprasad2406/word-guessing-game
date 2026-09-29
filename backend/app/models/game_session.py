"""SQLAlchemy model for GameSession entity and GameStatus enum."""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.guess import Guess
    from app.models.user import User
    from app.models.word import Word


class GameStatus(str, enum.Enum):
    """Game session outcome states."""
    ACTIVE = "ACTIVE"
    WON = "WON"
    LOST = "LOST"
    EXPIRED = "EXPIRED"


class GameSession(Base, TimestampMixin):
    """Game session database model preserving immutable settings snapshot."""

    __tablename__ = "game_sessions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )
    public_id: Mapped[str] = mapped_column(
        String(36),
        default=lambda: str(uuid.uuid4()),
        unique=True,
        nullable=False,
        index=True,
    )
    player_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    word_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("words.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[GameStatus] = mapped_column(
        Enum(GameStatus, name="game_status_enum", native_enum=False),
        default=GameStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    max_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    attempts_used: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    hints_used: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    hint_revealed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    settings_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    player: Mapped["User"] = relationship("User", foreign_keys=[player_id])
    word: Mapped["Word"] = relationship("Word", back_populates="game_sessions", foreign_keys=[word_id])
    guesses: Mapped[List["Guess"]] = relationship(
        "Guess",
        back_populates="game_session",
        cascade="all, delete-orphan",
        order_by="Guess.attempt_number",
    )

    def __repr__(self) -> str:
        return (
            f"<GameSession(id={self.id}, player_id={self.player_id}, "
            f"word_id={self.word_id}, status='{self.status}', attempts={self.attempts_used}/{self.max_attempts})>"
        )
