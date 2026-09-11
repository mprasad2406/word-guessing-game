"""Security utilities for password hashing and JWT token management."""

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional
import jwt

from app.core.config import get_settings
from app.core.exceptions import InvalidTokenException, TokenExpiredException

try:
    from argon2 import PasswordHasher
    from argon2.exceptions import InvalidHash, VerificationError, VerifyMismatchError
    _hasher: Optional[PasswordHasher] = PasswordHasher()
except ImportError:
    _hasher = None


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using Argon2id.
    Falls back to PBKDF2-HMAC-SHA256 if argon2-cffi is not yet installed in the environment.
    """
    if _hasher is not None:
        return _hasher.hash(password)

    # Standard library fallback using PBKDF2-HMAC-SHA256 with 100,000 iterations
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2:sha256:100000${salt}${dk.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2id or PBKDF2 hash."""
    if hashed_password.startswith("$argon2"):
        if _hasher is not None:
            try:
                return _hasher.verify(hashed_password, plain_password)
            except (VerifyMismatchError, VerificationError, InvalidHash):
                return False
        return False

    if hashed_password.startswith("pbkdf2:sha256:"):
        try:
            parts = hashed_password.split("$")
            if len(parts) != 3:
                return False
            header, salt, expected_hash = parts
            iterations = int(header.split(":")[2])
            dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), iterations)
            return hmac.compare_digest(dk.hex(), expected_hash)
        except Exception:
            return False

    # Try Argon2 if format is not recognized
    if _hasher is not None:
        try:
            return _hasher.verify(hashed_password, plain_password)
        except Exception:
            return False

    return False


def create_access_token(
    subject: Any,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> tuple[str, int]:
    """
    Create a signed JWT access token.
    
    Returns:
        tuple[str, int]: (encoded_jwt_token, expires_in_seconds)
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now + expires_delta
        expires_in = int(expires_delta.total_seconds())
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid.uuid4()),
        "type": "access",
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return token, expires_in


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT access token.
    
    Raises:
        TokenExpiredException: If the token has expired.
        InvalidTokenException: If the token is invalid or malformed.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat", "jti", "type"]},
        )
        if payload.get("type") != "access":
            raise InvalidTokenException("Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise TokenExpiredException("Authentication token has expired")
    except jwt.PyJWTError:
        raise InvalidTokenException("Could not validate credentials")


def create_refresh_token(
    subject: Any,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> tuple[str, int]:
    """
    Create a signed JWT refresh token.
    
    Returns:
        tuple[str, int]: (encoded_jwt_token, expires_in_seconds)
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now + expires_delta
        expires_in = int(expires_delta.total_seconds())
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        expires_in = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid.uuid4()),
        "type": "refresh",
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return token, expires_in


def decode_refresh_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT refresh token.
    
    Raises:
        TokenExpiredException: If the refresh token has expired.
        InvalidTokenException: If the refresh token is invalid or malformed.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat", "jti", "type"]},
        )
        if payload.get("type") != "refresh":
            raise InvalidTokenException("Invalid token type for refresh")
        return payload
    except jwt.ExpiredSignatureError:
        raise TokenExpiredException("Refresh token has expired")
    except jwt.PyJWTError:
        raise InvalidTokenException("Could not validate refresh token")

