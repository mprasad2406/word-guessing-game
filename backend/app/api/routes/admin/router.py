"""Aggregated router for all Admin endpoints."""

from fastapi import APIRouter

from app.api.routes.admin.game_settings import router as settings_router
from app.api.routes.admin.reports import router as reports_router
from app.api.routes.admin.security import router as security_router
from app.api.routes.admin.users import router as users_router
from app.api.routes.admin.words import router as words_router

admin_router = APIRouter(prefix="/admin")
admin_router.include_router(words_router)
admin_router.include_router(settings_router)
admin_router.include_router(security_router)
admin_router.include_router(users_router)
admin_router.include_router(reports_router)

