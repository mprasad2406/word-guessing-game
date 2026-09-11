"""Standardized API response and error envelope schemas."""

from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel

DataT = TypeVar("DataT")


class ApiError(BaseModel):
    """Standard error payload structure."""

    code: str
    details: Optional[Any] = None


class ApiResponse(BaseModel, Generic[DataT]):
    """Standardized API response wrapper for all endpoints."""

    success: bool
    message: str
    data: Optional[DataT] = None
    error: Optional[ApiError] = None
    meta: Optional[dict[str, Any]] = None

    @classmethod
    def success_response(
        cls,
        data: Optional[DataT] = None,
        message: str = "Operation successful",
        meta: Optional[dict[str, Any]] = None,
    ) -> "ApiResponse[DataT]":
        """Convenience constructor for success responses."""
        return cls(
            success=True,
            message=message,
            data=data,
            error=None,
            meta=meta,
        )

    @classmethod
    def error_response(
        cls,
        code: str,
        message: str,
        details: Optional[Any] = None,
        meta: Optional[dict[str, Any]] = None,
    ) -> "ApiResponse[None]":
        """Convenience constructor for error responses."""
        return cls(
            success=False,
            message=message,
            data=None,
            error=ApiError(code=code, details=details),
            meta=meta,
        )
