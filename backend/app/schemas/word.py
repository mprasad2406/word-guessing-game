"""Pydantic schemas for Word management."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.exceptions import ValidationException
from app.models.word import DifficultyLevel


class WordCreateRequest(BaseModel):
    """Schema for creating a new word."""

    word: str = Field(..., min_length=2, max_length=50, description="The secret word (alphabetic letters only).")
    hint: Optional[str] = Field(None, max_length=255, description="Optional hint for the word.")
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.MEDIUM, description="Word difficulty level.")
    is_active: bool = Field(default=True, description="Whether the word is immediately active for gameplay.")

    @field_validator("word")
    @classmethod
    def validate_word(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValidationException("Word must be a string")
        cleaned = v.strip().lower()
        if not cleaned.isalpha():
            raise ValidationException("Word must contain only alphabetic letters")
        if len(cleaned) < 2:
            raise ValidationException("Word must contain at least 2 letters")
        return cleaned


class WordUpdateRequest(BaseModel):
    """Schema for updating an existing word."""

    word: Optional[str] = Field(None, min_length=2, max_length=50)
    hint: Optional[str] = Field(None, max_length=255)
    difficulty: Optional[DifficultyLevel] = None
    is_active: Optional[bool] = None

    @field_validator("word")
    @classmethod
    def validate_word(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip().lower()
        if not cleaned.isalpha():
            raise ValidationException("Word must contain only alphabetic letters")
        if len(cleaned) < 2:
            raise ValidationException("Word must contain at least 2 letters")
        return cleaned


class PermanentDeleteWordRequest(BaseModel):
    """Schema for permanently deleting a word (requires admin security key)."""

    security_key: str = Field(..., min_length=1, description="Admin security key for dangerous action verification.")


class WordResponse(BaseModel):
    """Public representation of a Word entity for administrators."""

    id: int
    word: str
    hint: Optional[str] = None
    difficulty: DifficultyLevel
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: datetime
    appearance_count: Optional[int] = 0
    solve_rate: Optional[float] = None
    average_attempts: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class WordListResponse(BaseModel):
    """Paginated list of words."""

    items: List[WordResponse]
    total: int
    page: int
    page_size: int
    pages: int
