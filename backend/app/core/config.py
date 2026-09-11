"""Application configuration management using Pydantic Settings."""

from functools import lru_cache
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings schema loaded from environment variables and .env file."""

    APP_NAME: str = "Guess the Word API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database Configuration (MySQL async driver)
    DATABASE_URL: str = "mysql+asyncmy://root:password@localhost:3306/guess_the_word"

    # JWT Authentication
    JWT_SECRET_KEY: str = "dev-secret-key-change-this-in-production-min-32-chars-long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS and Frontend Configuration
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173"

    # Rate Limiting
    LOGIN_RATE_LIMIT: str = "5/minute"
    REGISTER_RATE_LIMIT: str = "5/hour"

    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated ALLOWED_ORIGINS string to a list of allowed origins."""
        if isinstance(self.ALLOWED_ORIGINS, list):
            return self.ALLOWED_ORIGINS
        if isinstance(self.ALLOWED_ORIGINS, str):
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        return [self.FRONTEND_URL]

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Ensure MySQL / Postgres database URL uses async driver if standard prefix provided."""
        if v.startswith("mysql://"):
            return v.replace("mysql://", "mysql+asyncmy://", 1)
        if v.startswith("mysql+pymysql://"):
            return v.replace("mysql+pymysql://", "mysql+asyncmy://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if v.startswith("sqlite://") and not v.startswith("sqlite+aiosqlite://"):
            return v.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance factory."""
    return Settings()
