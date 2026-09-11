"""SQLAlchemy model for GameSettings entity."""

from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, CheckConstraint, Enum, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.word import DifficultyLevel

if TYPE_CHECKING:
    from app.models.user import User


class GameSettings(Base, TimestampMixin):
    """Global game configuration settings model (Singleton enforced at id=1)."""

    __tablename__ = "game_settings"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_game_settings_singleton"),
        CheckConstraint("max_attempts > 0", name="ck_game_settings_max_attempts_positive"),
        CheckConstraint("min_word_length > 0", name="ck_game_settings_min_word_length_positive"),
        CheckConstraint("max_word_length >= min_word_length", name="ck_game_settings_word_length_range"),
        CheckConstraint("max_hints >= 0", name="ck_game_settings_max_hints_non_negative"),
        CheckConstraint("scoring_multiplier > 0", name="ck_game_settings_scoring_multiplier_positive"),
        CheckConstraint("daily_word_limit >= 0", name="ck_game_settings_daily_word_limit_non_negative"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        default=1,
        autoincrement=False,
    )
    max_attempts: Mapped[int] = mapped_column(
        Integer,
        default=6,
        nullable=False,
    )
    min_word_length: Mapped[int] = mapped_column(
        Integer,
        default=4,
        nullable=False,
    )
    max_word_length: Mapped[int] = mapped_column(
        Integer,
        default=8,
        nullable=False,
    )
    default_difficulty: Mapped[DifficultyLevel] = mapped_column(
        Enum(DifficultyLevel, name="game_settings_difficulty_enum", native_enum=False),
        default=DifficultyLevel.MEDIUM,
        nullable=False,
    )
    max_hints: Mapped[int] = mapped_column(
        Integer,
        default=2,
        nullable=False,
    )
    time_limit_seconds: Mapped[Optional[int]] = mapped_column(
        Integer,
        default=300,
        nullable=True,
    )
    scoring_multiplier: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
    )
    daily_word_limit: Mapped[int] = mapped_column(
        Integer,
        default=3,
        nullable=False,
    )
    allow_repeated_guesses: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    allow_word_reuse: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    game_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    updated_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    updater: Mapped[Optional["User"]] = relationship("User", foreign_keys=[updated_by])

    def __repr__(self) -> str:
        return (
            f"<GameSettings(id={self.id}, max_attempts={self.max_attempts}, "
            f"range=[{self.min_word_length}, {self.max_word_length}], game_enabled={self.game_enabled})>"
        )
