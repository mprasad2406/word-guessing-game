"""SQLAlchemy model for Word entity and DifficultyLevel enum."""

import enum
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.game_session import GameSession
    from app.models.user import User


class DifficultyLevel(str, enum.Enum):
    """Word and game difficulty levels."""
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class Word(Base, TimestampMixin):
    """Word database model."""

    __tablename__ = "words"
    __table_args__ = (
        UniqueConstraint("word", name="uq_words_word"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )
    word: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    hint: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    difficulty: Mapped[DifficultyLevel] = mapped_column(
        Enum(DifficultyLevel, name="difficulty_level_enum", native_enum=False),
        default=DifficultyLevel.MEDIUM,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    created_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Relationships
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    game_sessions: Mapped[List["GameSession"]] = relationship("GameSession", back_populates="word")

    def __repr__(self) -> str:
        return f"<Word(id={self.id}, word='{self.word}', difficulty='{self.difficulty}', is_active={self.is_active})>"
