"""API router configuration."""

from fastapi import APIRouter

from app.api.routes.admin.router import admin_router
from app.api.routes.auth import router as auth_router
from app.api.routes.games import router as games_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(games_router)
