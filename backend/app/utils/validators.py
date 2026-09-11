"""Input validation functions for usernames and passwords."""

import re
from app.core.exceptions import ValidationException

ALLOWED_PASSWORD_SPECIAL_CHARS = set("$%*&")


def validate_username(username: str) -> str:
    """
    Validate username according to the specification:
    - Length: 5 to 12 characters
    - Letters, numbers, and underscore only (no other special characters or spaces)
    - Case is optional
    """
    if not isinstance(username, str):
        raise ValidationException("Username must be a string")

    cleaned_username = username.strip()
    if len(cleaned_username) < 5:
        raise ValidationException("Username must contain at least 5 characters")

    if len(cleaned_username) > 12:
        raise ValidationException("Username cannot exceed 12 characters")

    if not re.match(r"^[a-zA-Z0-9_]+$", cleaned_username):
        raise ValidationException("Username can only contain letters, numbers, and underscores (_)")

    return cleaned_username


def validate_password(password: str) -> str:
    """
    Validate password according to the specification:
    - Length: 5 to 16 characters
    - At least one alphabetic character
    - At least one numeric character
    - At least one special character (any special character / non-alphanumeric)
    """
    if not isinstance(password, str):
        raise ValidationException("Password must be a string")

    if len(password) < 5:
        raise ValidationException("Password must contain at least 5 characters")

    if len(password) > 16:
        raise ValidationException("Password cannot exceed 16 characters")

    has_alpha = any(c.isalpha() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)

    if not has_alpha:
        raise ValidationException("Password must contain at least one alphabetic letter")

    if not has_digit:
        raise ValidationException("Password must contain at least one numeric digit")

    if not has_special:
        raise ValidationException("Password must contain at least one special character (e.g. $, %, *, &, @, !, #, etc.)")

    return password
