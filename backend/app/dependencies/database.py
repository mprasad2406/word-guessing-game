"""Database, repository, and service dependency providers."""

from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.repositories.admin_security_repository import AdminSecurityRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.game_session_repository import GameSessionRepository
from app.repositories.game_settings_repository import GameSettingsRepository
from app.repositories.guess_repository import GuessRepository
from app.repositories.user_repository import UserRepository
from app.repositories.word_repository import WordRepository
from app.services.admin_security_service import AdminSecurityService
from app.services.admin_user_service import AdminUserService
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService
from app.services.game_settings_service import GameSettingsService
from app.services.gameplay_service import GameplayService
from app.services.word_service import WordService


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session per request."""
    async for session in get_db_session():
        yield session


# --- Repository Providers ---


def get_user_repository(session: AsyncSession = Depends(get_db)) -> UserRepository:
    """Dependency provider for UserRepository."""
    return UserRepository(session=session)


def get_audit_log_repository(session: AsyncSession = Depends(get_db)) -> AuditLogRepository:
    """Dependency provider for AuditLogRepository."""
    return AuditLogRepository(session=session)


def get_admin_security_repository(session: AsyncSession = Depends(get_db)) -> AdminSecurityRepository:
    """Dependency provider for AdminSecurityRepository."""
    return AdminSecurityRepository(session=session)


def get_word_repository(session: AsyncSession = Depends(get_db)) -> WordRepository:
    """Dependency provider for WordRepository."""
    return WordRepository(session=session)


def get_game_settings_repository(session: AsyncSession = Depends(get_db)) -> GameSettingsRepository:
    """Dependency provider for GameSettingsRepository."""
    return GameSettingsRepository(session=session)


def get_guess_repository(session: AsyncSession = Depends(get_db)) -> GuessRepository:
    """Dependency provider for GuessRepository."""
    return GuessRepository(session=session)


def get_game_session_repository(session: AsyncSession = Depends(get_db)) -> GameSessionRepository:
    """Dependency provider for GameSessionRepository."""
    return GameSessionRepository(session=session)


# --- Service Providers ---


def get_auth_service(user_repo: UserRepository = Depends(get_user_repository)) -> AuthService:
    """Dependency provider for AuthService."""
    return AuthService(user_repository=user_repo)


def get_audit_service(
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
) -> AuditService:
    """Dependency provider for AuditService."""
    return AuditService(audit_repo=audit_repo)


def get_admin_security_service(
    security_repo: AdminSecurityRepository = Depends(get_admin_security_repository),
    audit_service: AuditService = Depends(get_audit_service),
) -> AdminSecurityService:
    """Dependency provider for AdminSecurityService."""
    return AdminSecurityService(
        security_repo=security_repo,
        audit_service=audit_service,
    )


def get_word_service(
    word_repo: WordRepository = Depends(get_word_repository),
    admin_security_service: AdminSecurityService = Depends(get_admin_security_service),
    audit_service: AuditService = Depends(get_audit_service),
) -> WordService:
    """Dependency provider for WordService."""
    return WordService(
        word_repo=word_repo,
        admin_security_service=admin_security_service,
        audit_service=audit_service,
    )


def get_game_settings_service(
    settings_repo: GameSettingsRepository = Depends(get_game_settings_repository),
    admin_security_service: AdminSecurityService = Depends(get_admin_security_service),
    audit_service: AuditService = Depends(get_audit_service),
) -> GameSettingsService:
    """Dependency provider for GameSettingsService."""
    return GameSettingsService(
        settings_repo=settings_repo,
        admin_security_service=admin_security_service,
        audit_service=audit_service,
    )


def get_gameplay_service(
    game_session_repo: GameSessionRepository = Depends(get_game_session_repository),
    guess_repo: GuessRepository = Depends(get_guess_repository),
    settings_repo: GameSettingsRepository = Depends(get_game_settings_repository),
) -> GameplayService:
    """Dependency provider for GameplayService."""
    return GameplayService(
        game_session_repo=game_session_repo,
        guess_repo=guess_repo,
        settings_repo=settings_repo,
    )


def get_admin_user_service(
    user_repo: UserRepository = Depends(get_user_repository),
    game_session_repo: GameSessionRepository = Depends(get_game_session_repository),
    audit_service: AuditService = Depends(get_audit_service),
) -> AdminUserService:
    """Dependency provider for AdminUserService."""
    return AdminUserService(
        user_repo=user_repo,
        game_session_repo=game_session_repo,
        audit_service=audit_service,
    )


from app.repositories.admin_reports_repository import AdminReportsRepository
from app.services.admin_reports_service import AdminReportsService


def get_admin_reports_repository(session: AsyncSession = Depends(get_db)) -> AdminReportsRepository:
    """Dependency provider for AdminReportsRepository."""
    return AdminReportsRepository(session=session)


def get_admin_reports_service(
    reports_repo: AdminReportsRepository = Depends(get_admin_reports_repository),
) -> AdminReportsService:
    """Dependency provider for AdminReportsService."""
    return AdminReportsService(reports_repo=reports_repo)


