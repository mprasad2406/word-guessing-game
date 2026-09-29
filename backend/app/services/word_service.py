"""Service for Word management operations."""

from typing import Optional
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import (
    AppException,
    ErrorCode,
    ValidationException,
    WordAlreadyExistsException,
    WordNotFoundException,
)
from app.models.word import DifficultyLevel
from app.repositories.word_repository import WordRepository
from app.schemas.word import (
    WordCreateRequest,
    WordListResponse,
    WordResponse,
    WordUpdateRequest,
)
from app.services.admin_security_service import AdminSecurityService
from app.services.audit_service import AuditService


class WordService:
    """Business logic service for Word operations."""

    def __init__(
        self,
        word_repo: WordRepository,
        admin_security_service: AdminSecurityService,
        audit_service: AuditService,
    ) -> None:
        self.word_repo = word_repo
        self.security_service = admin_security_service
        self.audit_service = audit_service

    async def create_word(
        self,
        payload: WordCreateRequest,
        admin_user_id: int,
        ip_address: Optional[str] = None,
    ) -> WordResponse:
        """Create a new word entry."""
        if await self.word_repo.exists_by_word(payload.word):
            raise WordAlreadyExistsException(f"Word '{payload.word}' already exists")

        try:
            word = await self.word_repo.create(
                word=payload.word,
                hint=payload.hint,
                difficulty=payload.difficulty,
                is_active=payload.is_active,
                created_by=admin_user_id,
            )
            await self.audit_service.log_action(
                admin_user_id=admin_user_id,
                action="WORD_CREATED",
                target_type="WORD",
                target_id=str(word.id),
                description=f"Created word '{word.word}' with difficulty {word.difficulty.value}",
                ip_address=ip_address,
            )
            return WordResponse.model_validate(word)
        except IntegrityError:
            raise WordAlreadyExistsException(f"Word '{payload.word}' already exists")

    async def list_words(
        self,
        is_active: Optional[bool] = None,
        difficulty: Optional[DifficultyLevel] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> WordListResponse:
        """Retrieve paginated list of words with optional filters."""
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        items, total = await self.word_repo.list_words(
            is_active=is_active,
            difficulty=difficulty,
            page=page,
            page_size=page_size,
        )
        pages = (total + page_size - 1) // page_size if total > 0 else 1

        item_responses = []
        for item in items:
            resp = WordResponse.model_validate(item)
            stats = await self.word_repo.get_word_usage_stats(item.id)
            resp.appearance_count = stats.get("appearance_count", 0)
            resp.solve_rate = stats.get("solve_rate")
            resp.average_attempts = stats.get("average_attempts")
            item_responses.append(resp)

        return WordListResponse(
            items=item_responses,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def get_word(self, word_id: int) -> WordResponse:
        """Retrieve a single word by ID with gameplay usage statistics."""
        word = await self.word_repo.get_by_id(word_id)
        if not word:
            raise WordNotFoundException(f"Word with ID {word_id} not found")
        
        stats = await self.word_repo.get_word_usage_stats(word_id)
        resp = WordResponse.model_validate(word)
        resp.appearance_count = stats.get("appearance_count", 0)
        resp.solve_rate = stats.get("solve_rate")
        resp.average_attempts = stats.get("average_attempts")
        return resp

    async def update_word(
        self,
        word_id: int,
        payload: WordUpdateRequest,
        admin_user_id: int,
        ip_address: Optional[str] = None,
    ) -> WordResponse:
        """Update fields of an existing word."""
        word = await self.word_repo.get_by_id(word_id)
        if not word:
            raise WordNotFoundException(f"Word with ID {word_id} not found")

        if payload.word is not None and payload.word != word.word:
            existing = await self.word_repo.get_by_word(payload.word)
            if existing and existing.id != word.id:
                raise WordAlreadyExistsException(f"Word '{payload.word}' already exists")

        try:
            updated_word = await self.word_repo.update(
                word_entity=word,
                word=payload.word,
                hint=payload.hint,
                difficulty=payload.difficulty,
                is_active=payload.is_active,
            )
            await self.audit_service.log_action(
                admin_user_id=admin_user_id,
                action="WORD_UPDATED",
                target_type="WORD",
                target_id=str(updated_word.id),
                description=f"Updated word '{updated_word.word}'",
                ip_address=ip_address,
            )
            return WordResponse.model_validate(updated_word)
        except IntegrityError:
            raise WordAlreadyExistsException("Word uniqueness constraint violated")

    async def deactivate_word(
        self,
        word_id: int,
        admin_user_id: int,
        ip_address: Optional[str] = None,
    ) -> WordResponse:
        """Soft-delete (deactivate) a word by setting is_active = False."""
        word = await self.word_repo.get_by_id(word_id)
        if not word:
            raise WordNotFoundException(f"Word with ID {word_id} not found")

        updated_word = await self.word_repo.update(
            word_entity=word,
            is_active=False,
        )
        await self.audit_service.log_action(
            admin_user_id=admin_user_id,
            action="WORD_DEACTIVATED",
            target_type="WORD",
            target_id=str(updated_word.id),
            description=f"Deactivated word '{updated_word.word}' (soft delete)",
            ip_address=ip_address,
        )
        return WordResponse.model_validate(updated_word)

    async def permanent_delete_word(
        self,
        word_id: int,
        security_key: str,
        admin_user_id: int,
        ip_address: Optional[str] = None,
    ) -> None:
        """
        Permanently delete a word after verifying the admin security key.
        Prevents deletion if the word is referenced by existing game sessions.
        """
        await self.security_service.verify_security_key(security_key)

        word = await self.word_repo.get_by_id(word_id)
        if not word:
            raise WordNotFoundException(f"Word with ID {word_id} not found")

        ref_count = await self.word_repo.count_game_sessions_referencing_word(word_id)
        if ref_count > 0:
            raise AppException(
                status_code=400,
                message=(
                    f"Cannot permanently delete word '{word.word}' because it is associated "
                    f"with {ref_count} existing game session(s). Deactivate it instead."
                ),
                error_code=ErrorCode.VALIDATION_ERROR,
            )

        deleted_word_text = word.word
        await self.word_repo.delete_permanent(word)

        await self.audit_service.log_action(
            admin_user_id=admin_user_id,
            action="WORD_DELETED_PERMANENT",
            target_type="WORD",
            target_id=str(word_id),
            description=f"Permanently deleted word '{deleted_word_text}'",
            ip_address=ip_address,
        )
