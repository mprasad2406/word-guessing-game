"""Authentication and user management business logic."""

from app.core.exceptions import (
    DuplicateUsernameException,
    InvalidCredentialsException,
    UserInactiveException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse


class AuthService:
    """Service handling user registration, authentication, and profile resolution."""

    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repo = user_repository

    async def register(self, request: RegisterRequest) -> UserResponse:
        """
        Register a new player account.
        Public registration always assigns the PLAYER role.
        """
        if await self.user_repo.exists_by_username(request.username):
            raise DuplicateUsernameException("Username is already taken")

        hashed_pwd = hash_password(request.password)
        user = await self.user_repo.create(
            username=request.username,
            password_hash=hashed_pwd,
            role=UserRole.PLAYER,
        )
        return UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        )

    async def check_username_availability(self, username: str) -> bool:
        """Check if a given username is available (not taken)."""
        exists = await self.user_repo.exists_by_username(username.strip())
        return not exists

    async def authenticate(self, request: LoginRequest) -> TokenResponse:
        """
        Authenticate user credentials and issue access and refresh tokens.
        Returns a generic error if credentials do not match to prevent user enumeration.
        """
        user = await self.user_repo.get_by_username(request.username)
        if not user or not verify_password(request.password, user.password_hash):
            raise InvalidCredentialsException("Invalid username or password")

        if not user.is_active:
            raise UserInactiveException("Account is blocked. Please contact the administrator.")

        access_token, expires_in = create_access_token(
            subject=user.id,
            role=user.role.value,
        )
        refresh_token, _ = create_refresh_token(
            subject=user.id,
            role=user.role.value,
        )

        user_response = UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in,
            refresh_token=refresh_token,
            user=user_response,
        )

    async def refresh_tokens(self, refresh_token_str: str) -> TokenResponse:
        """
        Validate refresh token and issue a fresh access token and refresh token.
        """
        payload = decode_refresh_token(refresh_token_str)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise InvalidCredentialsException("Invalid token payload")

        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise InvalidCredentialsException("Invalid token subject")

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise InvalidCredentialsException("User not found")

        if not user.is_active:
            raise UserInactiveException("Account is blocked. Please contact the administrator.")

        new_access_token, expires_in = create_access_token(
            subject=user.id,
            role=user.role.value,
        )
        new_refresh_token, _ = create_refresh_token(
            subject=user.id,
            role=user.role.value,
        )

        user_response = UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        )

        return TokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=expires_in,
            refresh_token=new_refresh_token,
            user=user_response,
        )

    async def get_user_profile(self, user_id: int) -> UserResponse:
        """Retrieve user profile by ID."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise InvalidCredentialsException("User not found")
        return UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        )
