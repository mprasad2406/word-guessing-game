"""Admin API routes for Word management."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status

from app.dependencies.authorization import require_admin
from app.dependencies.database import get_word_service
from app.models.user import User
from app.models.word import DifficultyLevel
from app.schemas.common import ApiResponse
from app.schemas.word import (
    PermanentDeleteWordRequest,
    WordCreateRequest,
    WordListResponse,
    WordResponse,
    WordUpdateRequest,
)
from app.services.word_service import WordService

router = APIRouter(prefix="/words", tags=["Admin - Words"])


@router.post(
    "",
    response_model=ApiResponse[WordResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new word",
    description="Admin-only endpoint to add a new word to the dictionary.",
)
async def create_word(
    request: Request,
    payload: WordCreateRequest,
    current_admin: User = Depends(require_admin),
    word_service: WordService = Depends(get_word_service),
) -> ApiResponse[WordResponse]:
    """Create a new word entry."""
    client_ip = request.client.host if request.client else None
    word = await word_service.create_word(
        payload=payload,
        admin_user_id=current_admin.id,
        ip_address=client_ip,
    )
    return ApiResponse.success_response(
        data=word,
        message="Word created successfully",
    )


@router.get(
    "",
    response_model=ApiResponse[WordListResponse],
    status_code=status.HTTP_200_OK,
    summary="List all words",
    description="Admin-only endpoint to retrieve paginated words with optional difficulty and active state filters.",
)
async def list_words(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    difficulty: Optional[DifficultyLevel] = Query(None, description="Filter by difficulty"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_admin: User = Depends(require_admin),
    word_service: WordService = Depends(get_word_service),
) -> ApiResponse[WordListResponse]:
    """Retrieve words list."""
    result = await word_service.list_words(
        is_active=is_active,
        difficulty=difficulty,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success_response(
        data=result,
        message="Words retrieved successfully",
    )


@router.get(
    "/{word_id}",
    response_model=ApiResponse[WordResponse],
    status_code=status.HTTP_200_OK,
    summary="Get word details",
    description="Admin-only endpoint to fetch a single word by its ID.",
)
async def get_word(
    word_id: int,
    current_admin: User = Depends(require_admin),
    word_service: WordService = Depends(get_word_service),
) -> ApiResponse[WordResponse]:
    """Fetch single word by ID."""
    word = await word_service.get_word(word_id=word_id)
    return ApiResponse.success_response(
        data=word,
        message="Word details retrieved successfully",
    )


@router.patch(
    "/{word_id}",
    response_model=ApiResponse[WordResponse],
    status_code=status.HTTP_200_OK,
    summary="Update a word",
    description="Admin-only endpoint to update word text, hint, difficulty, or active status.",
)
async def update_word(
    request: Request,
    word_id: int,
    payload: WordUpdateRequest,
    current_admin: User = Depends(require_admin),
    word_service: WordService = Depends(get_word_service),
) -> ApiResponse[WordResponse]:
    """Update word details."""
    client_ip = request.client.host if request.client else None
    word = await word_service.update_word(
        word_id=word_id,
        payload=payload,
        admin_user_id=current_admin.id,
        ip_address=client_ip,
    )
    return ApiResponse.success_response(
        data=word,
        message="Word updated successfully",
    )


@router.delete(
    "/{word_id}",
    response_model=ApiResponse[WordResponse],
    status_code=status.HTTP_200_OK,
    summary="Soft-delete (deactivate) a word",
    description="Admin-only endpoint to deactivate a word by default (soft deletion).",
)
async def deactivate_word(
    request: Request,
    word_id: int,
    current_admin: User = Depends(require_admin),
    word_service: WordService = Depends(get_word_service),
) -> ApiResponse[WordResponse]:
    """Soft-delete a word."""
    client_ip = request.client.host if request.client else None
    word = await word_service.deactivate_word(
        word_id=word_id,
        admin_user_id=current_admin.id,
        ip_address=client_ip,
    )
    return ApiResponse.success_response(
        data=word,
        message="Word deactivated successfully (soft-deleted)",
    )


@router.post(
    "/{word_id}/permanent-delete",
    response_model=ApiResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Permanently delete a word",
    description="Admin-only dangerous endpoint to permanently remove a word. Requires admin security key in request body and verifies no game sessions reference the word.",
)
async def permanent_delete_word(
    request: Request,
    word_id: int,
    payload: PermanentDeleteWordRequest,
    current_admin: User = Depends(require_admin),
    word_service: WordService = Depends(get_word_service),
) -> ApiResponse[None]:
    """Permanently delete a word after verifying the security key."""
    client_ip = request.client.host if request.client else None
    await word_service.permanent_delete_word(
        word_id=word_id,
        security_key=payload.security_key,
        admin_user_id=current_admin.id,
        ip_address=client_ip,
    )
    return ApiResponse.success_response(
        data=None,
        message="Word permanently deleted successfully",
    )
