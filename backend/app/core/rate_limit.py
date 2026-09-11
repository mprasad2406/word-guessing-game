"""Rate limiting configuration using slowapi."""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Global limiter instance utilizing client remote IP
limiter = Limiter(key_func=get_remote_address)
