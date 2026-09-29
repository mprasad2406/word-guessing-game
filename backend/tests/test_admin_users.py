import pytest
import httpx
from app.main import app
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_admin_user_management_endpoints():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create an admin token
        admin_token, _ = create_access_token(subject=1, role="ADMIN")
        headers = {"Authorization": f"Bearer {admin_token}"}

        # 1. Test Overview Stats
        res = await ac.get("/api/v1/admin/users/stats/overview", headers=headers)
        assert res.status_code == 200
        stats = res.json()["data"]
        assert "total_users" in stats
        assert "active_users" in stats
        assert "blocked_users" in stats
        assert "active_7d_users" in stats

        # 2. Test List Users
        res = await ac.get("/api/v1/admin/users?sort_by=newest&page=1&page_size=10", headers=headers)
        assert res.status_code == 200
        users_data = res.json()["data"]
        assert "items" in users_data
        assert "total" in users_data
        assert len(users_data["items"]) > 0

        first_user = users_data["items"][0]
        assert "public_id" in first_user
        assert "username" in first_user
        assert "role" in first_user
        assert "win_rate" in first_user

        # 3. Test Get User Details by identifier (public_id)
        user_identifier = first_user["public_id"]
        res = await ac.get(f"/api/v1/admin/users/{user_identifier}", headers=headers)
        assert res.status_code == 200
        user_detail = res.json()["data"]
        assert user_detail["username"] == first_user["username"]
        assert "total_games" in user_detail
        assert "win_rate" in user_detail

        # 4. Test User Game History
        res = await ac.get(f"/api/v1/admin/users/{user_identifier}/games?page=1&page_size=10", headers=headers)
        assert res.status_code == 200
        games_data = res.json()["data"]
        assert "items" in games_data
        assert "total" in games_data

        # If user has games, test admin match details inspection
        if len(games_data["items"]) > 0:
            match_item = games_data["items"][0]
            match_uuid = match_item["public_id"]
            res_match = await ac.get(
                f"/api/v1/admin/users/{user_identifier}/matches/{match_uuid}",
                headers=headers,
            )
            assert res_match.status_code == 200
            match_detail = res_match.json()["data"]
            assert match_detail["public_id"] == match_uuid
            assert "guesses" in match_detail
            assert "final_word" in match_detail

        # 6. Test Admin Words List with usage stats
        res_words = await ac.get("/api/v1/admin/words?page=1&page_size=10", headers=headers)
        assert res_words.status_code == 200
        words_data = res_words.json()["data"]
        assert "items" in words_data
        assert "total" in words_data
        if len(words_data["items"]) > 0:
            first_w = words_data["items"][0]
            assert "appearance_count" in first_w

