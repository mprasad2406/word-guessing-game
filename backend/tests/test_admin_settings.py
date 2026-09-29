import pytest
import httpx
from app.main import app
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_admin_settings_endpoints():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        admin_token, _ = create_access_token(subject=1, role="ADMIN")
        user_token, _ = create_access_token(subject=2, role="USER")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # 1. Test unauthorized & non-admin access
        res_unauth = await ac.get("/api/v1/admin/game-settings")
        assert res_unauth.status_code == 401

        res_user = await ac.get("/api/v1/admin/game-settings", headers=user_headers)
        assert res_user.status_code == 403

        # 2. Test Get Game Settings
        res_get = await ac.get("/api/v1/admin/game-settings", headers=admin_headers)
        assert res_get.status_code == 200
        data = res_get.json()["data"]
        assert "game_enabled" in data
        assert "max_attempts" in data
        assert "min_word_length" in data
        assert "max_word_length" in data
        assert "max_hints" in data
        assert "time_limit_seconds" in data
        assert "allow_repeated_guesses" in data
        assert "allow_word_reuse" in data
        assert "default_difficulty" in data
        assert "scoring_multiplier" in data
        assert "daily_word_limit" in data

        # 3. Test non-critical update without security key (e.g. allow_repeated_guesses, allow_word_reuse)
        res_patch_non_crit = await ac.patch(
            "/api/v1/admin/game-settings",
            json={"allow_word_reuse": True, "allow_repeated_guesses": False},
            headers=admin_headers,
        )
        assert res_patch_non_crit.status_code == 200
        assert res_patch_non_crit.json()["data"]["allow_word_reuse"] is True
        assert res_patch_non_crit.json()["data"]["allow_repeated_guesses"] is False

        # 4. Test critical updates without security key (max_attempts, max_hints, time_limit, difficulty should require security key)
        res_patch_crit_attempts = await ac.patch(
            "/api/v1/admin/game-settings",
            json={"max_attempts": 6},
            headers=admin_headers,
        )
        assert res_patch_crit_attempts.status_code in [400, 403]

        res_patch_crit_hints = await ac.patch(
            "/api/v1/admin/game-settings",
            json={"max_hints": 4},
            headers=admin_headers,
        )
        assert res_patch_crit_hints.status_code in [400, 403]

        res_patch_crit_time = await ac.patch(
            "/api/v1/admin/game-settings",
            json={"time_limit_seconds": 600},
            headers=admin_headers,
        )
        assert res_patch_crit_time.status_code in [400, 403]

        res_patch_crit_diff = await ac.patch(
            "/api/v1/admin/game-settings",
            json={"default_difficulty": "HARD"},
            headers=admin_headers,
        )
        assert res_patch_crit_diff.status_code in [400, 403]
