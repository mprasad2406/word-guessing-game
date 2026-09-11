"""FastAPI application factory and middleware configuration."""

import logging
from contextlib import asynccontextmanager
from typing import Any, Dict
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api.router import api_v1_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings
from app.core.exceptions import AppException, ErrorCode
from app.core.rate_limit import limiter
from app.db.init_db import init_db
from app.schemas.common import ApiResponse

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("guess_the_word")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown routines."""
    logger.info("Running application startup checks and initializers...")
    await init_db()
    yield
    logger.info("Application shutdown.")


def create_app() -> FastAPI:
    """Initialize and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        description="Backend API for the Guess the Word application.",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    # Attach rate limiter
    app.state.limiter = limiter

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Exception Handlers ---

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        """Handle custom application domain exceptions."""
        response_body = ApiResponse.error_response(
            code=exc.error_code,
            message=exc.message,
            details=exc.details,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=response_body.model_dump(),
        )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        """Handle rate limit exceeded exceptions."""
        response_body = ApiResponse.error_response(
            code=ErrorCode.RATE_LIMIT_EXCEEDED,
            message="Rate limit exceeded. Please try again later.",
            details={"detail": exc.detail},
        )
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content=response_body.model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Handle Pydantic request validation errors."""
        formatted_details: Dict[str, list[str]] = {}
        for err in exc.errors():
            loc = [str(item) for item in err.get("loc", []) if item != "body"]
            field_name = ".".join(loc) if loc else "non_field_errors"
            msg = err.get("msg", "Invalid value")
            # Strip standard pydantic prefix if present
            if msg.startswith("Value error, "):
                msg = msg[len("Value error, "):]
            
            if field_name not in formatted_details:
                formatted_details[field_name] = []
            formatted_details[field_name].append(msg)

        response_body = ApiResponse.error_response(
            code=ErrorCode.VALIDATION_ERROR,
            message="Validation failed",
            details=formatted_details,
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=response_body.model_dump(),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        """Handle standard HTTPExceptions."""
        error_code = ErrorCode.FORBIDDEN if exc.status_code == 403 else "HTTP_ERROR"
        response_body = ApiResponse.error_response(
            code=error_code,
            message=str(exc.detail) if exc.detail else "An HTTP error occurred",
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=response_body.model_dump(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle unexpected server errors gracefully without exposing internal secrets."""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        response_body = ApiResponse.error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message="An unexpected server error occurred.",
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=response_body.model_dump(),
        )

    # --- Register Routers ---
    app.include_router(health_router)
    app.include_router(api_v1_router)

    return app


app = create_app()
