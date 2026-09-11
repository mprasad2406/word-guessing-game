"""Custom domain exceptions and standard error codes."""

from typing import Any, Optional


class ErrorCode:
    """Standardized application error code constants."""

    VALIDATION_ERROR = "VALIDATION_ERROR"
    USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    USER_INACTIVE = "USER_INACTIVE"
    FORBIDDEN = "FORBIDDEN"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"

    # Stage 2: Words, Settings, and Security Error Codes
    WORD_ALREADY_EXISTS = "WORD_ALREADY_EXISTS"
    WORD_NOT_FOUND = "WORD_NOT_FOUND"
    SETTINGS_NOT_FOUND = "SETTINGS_NOT_FOUND"
    INVALID_SECURITY_KEY = "INVALID_SECURITY_KEY"
    SECURITY_KEY_REQUIRED = "SECURITY_KEY_REQUIRED"
    SECURITY_KEY_NOT_INITIALIZED = "SECURITY_KEY_NOT_INITIALIZED"

    # Stage 3: Gameplay and Guessing Error Codes
    GAME_DISABLED = "GAME_DISABLED"
    NO_ELIGIBLE_WORDS = "NO_ELIGIBLE_WORDS"
    GAME_NOT_FOUND = "GAME_NOT_FOUND"
    GAME_ALREADY_COMPLETED = "GAME_ALREADY_COMPLETED"
    INVALID_GUESS_LENGTH = "INVALID_GUESS_LENGTH"
    REPEATED_GUESS_NOT_ALLOWED = "REPEATED_GUESS_NOT_ALLOWED"
    NO_HINT_AVAILABLE = "NO_HINT_AVAILABLE"
    MAX_HINTS_REACHED = "MAX_HINTS_REACHED"
    DAILY_LIMIT_EXCEEDED = "DAILY_LIMIT_EXCEEDED"


class AppException(Exception):
    """Base application domain exception."""

    def __init__(
        self,
        status_code: int,
        message: str,
        error_code: str,
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.error_code = error_code
        self.details = details


class ValidationException(AppException):
    """Raised when client input fails business validation rules."""

    def __init__(self, message: str = "Validation failed", details: Optional[Any] = None):
        super().__init__(
            status_code=422,
            message=message,
            error_code=ErrorCode.VALIDATION_ERROR,
            details=details,
        )


class DuplicateUsernameException(AppException):
    """Raised when registration is attempted with an existing username."""

    def __init__(self, message: str = "Username already exists"):
        super().__init__(
            status_code=409,
            message=message,
            error_code=ErrorCode.USERNAME_ALREADY_EXISTS,
            details=None,
        )


class InvalidCredentialsException(AppException):
    """Raised when authentication credentials (username/password) are incorrect."""

    def __init__(self, message: str = "Invalid username or password"):
        super().__init__(
            status_code=401,
            message=message,
            error_code=ErrorCode.INVALID_CREDENTIALS,
            details=None,
        )


class AuthenticationRequiredException(AppException):
    """Raised when an unauthenticated request attempts to access a protected route."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            status_code=401,
            message=message,
            error_code=ErrorCode.AUTHENTICATION_REQUIRED,
            details=None,
        )


class InvalidTokenException(AppException):
    """Raised when a provided JWT is malformed, has invalid signature, or invalid claims."""

    def __init__(self, message: str = "Invalid authentication token"):
        super().__init__(
            status_code=401,
            message=message,
            error_code=ErrorCode.INVALID_TOKEN,
            details=None,
        )


class TokenExpiredException(AppException):
    """Raised when a provided JWT has expired."""

    def __init__(self, message: str = "Authentication token has expired"):
        super().__init__(
            status_code=401,
            message=message,
            error_code=ErrorCode.TOKEN_EXPIRED,
            details=None,
        )


class UserInactiveException(AppException):
    """Raised when an authenticated user account has been disabled/deactivated."""

    def __init__(self, message: str = "Account is blocked. Please contact the administrator."):
        super().__init__(
            status_code=403,
            message=message,
            error_code=ErrorCode.USER_INACTIVE,
            details=None,
        )


class ForbiddenException(AppException):
    """Raised when an authenticated user does not have sufficient role permissions."""

    def __init__(self, message: str = "Access forbidden: insufficient permissions"):
        super().__init__(
            status_code=403,
            message=message,
            error_code=ErrorCode.FORBIDDEN,
            details=None,
        )


class RateLimitExceededException(AppException):
    """Raised when client exceeds the rate limit."""

    def __init__(self, message: str = "Rate limit exceeded. Please try again later."):
        super().__init__(
            status_code=429,
            message=message,
            error_code=ErrorCode.RATE_LIMIT_EXCEEDED,
            details=None,
        )


# --- Stage 2 Domain Exceptions ---


class WordAlreadyExistsException(AppException):
    """Raised when attempting to add a word that already exists in the database."""

    def __init__(self, message: str = "Word already exists"):
        super().__init__(
            status_code=409,
            message=message,
            error_code=ErrorCode.WORD_ALREADY_EXISTS,
            details=None,
        )


class WordNotFoundException(AppException):
    """Raised when a requested word cannot be found."""

    def __init__(self, message: str = "Word not found"):
        super().__init__(
            status_code=404,
            message=message,
            error_code=ErrorCode.WORD_NOT_FOUND,
            details=None,
        )


class GameSettingsNotFoundException(AppException):
    """Raised when game settings cannot be found."""

    def __init__(self, message: str = "Game settings not found"):
        super().__init__(
            status_code=404,
            message=message,
            error_code=ErrorCode.SETTINGS_NOT_FOUND,
            details=None,
        )


class InvalidSecurityKeyException(AppException):
    """Raised when an admin provides an incorrect security key for dangerous actions."""

    def __init__(self, message: str = "Invalid security key"):
        super().__init__(
            status_code=403,
            message=message,
            error_code=ErrorCode.INVALID_SECURITY_KEY,
            details=None,
        )


class SecurityKeyRequiredException(AppException):
    """Raised when a dangerous action requires a security key but none was provided."""

    def __init__(self, message: str = "Security key is required for this operation"):
        super().__init__(
            status_code=403,
            message=message,
            error_code=ErrorCode.SECURITY_KEY_REQUIRED,
            details=None,
        )


class SecurityKeyNotInitializedException(AppException):
    """Raised when an operation requiring security key is performed before initialization."""

    def __init__(self, message: str = "Admin security key has not been initialized yet"):
        super().__init__(
            status_code=400,
            message=message,
            error_code=ErrorCode.SECURITY_KEY_NOT_INITIALIZED,
            details=None,
        )


# --- Stage 3 Domain Exceptions ---


class GameDisabledException(AppException):
    """Raised when game creation is attempted while the game is globally disabled."""

    def __init__(self, message: str = "Game is currently disabled by the administrator"):
        super().__init__(
            status_code=403,
            message=message,
            error_code=ErrorCode.GAME_DISABLED,
            details=None,
        )


class NoEligibleWordsException(AppException):
    """Raised when no words match current difficulty, length, or reuse criteria."""

    def __init__(self, message: str = "No eligible words available for gameplay under current settings"):
        super().__init__(
            status_code=404,
            message=message,
            error_code=ErrorCode.NO_ELIGIBLE_WORDS,
            details=None,
        )


class GameNotFoundException(AppException):
    """Raised when a game session is not found or does not belong to the user."""

    def __init__(self, message: str = "Game session not found"):
        super().__init__(
            status_code=404,
            message=message,
            error_code=ErrorCode.GAME_NOT_FOUND,
            details=None,
        )


class GameAlreadyCompletedException(AppException):
    """Raised when a guess or hint is submitted to a completed game."""

    def __init__(self, message: str = "Game session is already completed. No further actions permitted."):
        super().__init__(
            status_code=400,
            message=message,
            error_code=ErrorCode.GAME_ALREADY_COMPLETED,
            details=None,
        )


class InvalidGuessLengthException(AppException):
    """Raised when a guess length does not match the target word length."""

    def __init__(self, message: str = "Guess length does not match the target word length"):
        super().__init__(
            status_code=422,
            message=message,
            error_code=ErrorCode.INVALID_GUESS_LENGTH,
            details=None,
        )


class RepeatedGuessNotAllowedException(AppException):
    """Raised when a player submits a repeated guess and repeated guesses are disabled."""

    def __init__(self, message: str = "Repeated guesses are not allowed in this game session"):
        super().__init__(
            status_code=422,
            message=message,
            error_code=ErrorCode.REPEATED_GUESS_NOT_ALLOWED,
            details=None,
        )


class NoHintAvailableException(AppException):
    """Raised when a player requests a hint for a word that has no hint configured."""

    def __init__(self, message: str = "No hint is available for this word"):
        super().__init__(
            status_code=404,
            message=message,
            error_code=ErrorCode.NO_HINT_AVAILABLE,
            details=None,
        )


class MaxHintsReachedException(AppException):
    """Raised when a player has exhausted all allowed hints for the session."""

    def __init__(self, message: str = "Maximum hints limit reached for this game session"):
        super().__init__(
            status_code=400,
            message=message,
            error_code=ErrorCode.MAX_HINTS_REACHED,
            details=None,
        )


class DailyLimitReachedException(AppException):
    """Raised when a player exceeds the maximum allowed game sessions / words per day (max 3)."""

    def __init__(
        self,
        message: str = "Daily limit reached. You can only guess up to 3 words per day. Please come back tomorrow!",
    ):
        super().__init__(
            status_code=400,
            message=message,
            error_code=ErrorCode.DAILY_LIMIT_EXCEEDED,
            details=None,
        )
