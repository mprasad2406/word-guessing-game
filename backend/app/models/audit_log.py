"""SQLAlchemy model for AuditLog entity."""

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(Base):
    """Audit log model for sensitive and destructive administrative actions."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )
    admin_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    target_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    target_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    admin_user: Mapped["User"] = relationship("User", foreign_keys=[admin_user_id])

    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action='{self.action}', target='{self.target_type}:{self.target_id}')>"
