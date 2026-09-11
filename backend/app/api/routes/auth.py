"""Authentication endpoints for user registration, login, and profile fetching."""

from fastapi import APIRouter, Depends, Request, status

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.dependencies.authentication import get_current_active_user
from app.dependencies.database import get_auth_service
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshTokenRequest, RegisterRequest, TokenResponse
from app.schemas.common import ApiResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post(
    "/register",
    response_model=ApiResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new player account",
    description="Validates username and password rules, hashes password with Argon2id, and creates a PLAYER user.",
)
@limiter.limit(settings.REGISTER_RATE_LIMIT)
async def register(
    request: Request,
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ApiResponse[UserResponse]:
    """Register a new player user."""
    user = await auth_service.register(payload)
    return ApiResponse.success_response(
        data=user,
        message="User registered successfully",
    )


@router.get(
    "/check-username",
    response_model=ApiResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Check username availability",
    description="Check whether a given username is available or already taken.",
)
async def check_username(
    username: str,
    auth_service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    """Check if a username is available."""
    is_available = await auth_service.check_username_availability(username)
    return ApiResponse.success_response(
        data={"username": username, "available": is_available},
        message="Username is available" if is_available else "Username is already taken",
    )


@router.post(
    "/login",
    response_model=ApiResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Authenticate and receive JWT access token",
    description="Verifies user credentials and returns a short-lived signed JWT access token.",
)
@limiter.limit(settings.LOGIN_RATE_LIMIT)
async def login(
    request: Request,
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ApiResponse[TokenResponse]:
    """Authenticate credentials and issue JWT."""
    token_response = await auth_service.authenticate(payload)
    return ApiResponse.success_response(
        data=token_response,
        message="Login successful",
    )


@router.post(
    "/refresh",
    response_model=ApiResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Refresh expired access token",
    description="Validates a refresh token and returns a new access token and fresh refresh token.",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ApiResponse[TokenResponse]:
    """Refresh access token."""
    token_response = await auth_service.refresh_tokens(payload.refresh_token)
    return ApiResponse.success_response(
        data=token_response,
        message="Token refreshed successfully",
    )


@router.get(
    "/me",
    response_model=ApiResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
    description="Extracts the identity from the JWT access token and returns the current user profile.",
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
) -> ApiResponse[UserResponse]:
    """Retrieve the currently authenticated user profile."""
    user_response = UserResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )
    return ApiResponse.success_response(
        data=user_response,
        message="User profile retrieved successfully",
    )
