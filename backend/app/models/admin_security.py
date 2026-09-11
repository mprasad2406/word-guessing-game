"""SQLAlchemy model for AdminSecuritySettings entity."""

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class AdminSecuritySettings(Base):
    """Stores the Argon2id hash of the admin security key for high-risk actions (Singleton at id=1)."""

    __tablename__ = "admin_security_settings"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_admin_security_singleton"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        default=1,
        autoincrement=False,
    )
    secret_key_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    updated_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    updater: Mapped[Optional["User"]] = relationship("User", foreign_keys=[updated_by])

    def __repr__(self) -> str:
        return f"<AdminSecuritySettings(id={self.id}, updated_by={self.updated_by}, updated_at={self.updated_at})>"
