import pytest
from httpx import AsyncClient
from app.main import app
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_admin_user_management_endpoints():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create an admin token
        admin_token = create_access_token({"sub": "admin", "role": "ADMIN", "id": 1})
        headers = {"Authorization": f"Bearer {admin_token}"}

        # 1. Test Overview Stats
        res = await ac.get("/api/v1/admin/users/stats/overview", headers=headers)
        assert res.status_code == 200
        stats = res.json()
        assert "total_users" in stats
        assert "active_users" in stats
        assert "blocked_users" in stats
        assert "active_last_7_days" in stats

        # 2. Test List Users
        res = await ac.get("/api/v1/admin/users?sort_by=NEWEST&page=1&page_size=10", headers=headers)
        assert res.status_code == 200
        users_data = res.json()
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
        user_detail = res.json()
        assert user_detail["username"] == first_user["username"]
        assert "total_games" in user_detail
        assert "win_rate" in user_detail

        # 4. Test User Game History
        res = await ac.get(f"/api/v1/admin/users/{user_identifier}/games?page=1&page_size=10", headers=headers)
        assert res.status_code == 200
        games_data = res.json()
        assert "items" in games_data
        assert "total" in games_data

        # 5. Test Prevent Self-Block
        # Admin is id=1 / "admin"
        res = await ac.patch(
            "/api/v1/admin/users/admin/status",
            json={"is_active": False},
            headers=headers,
        )
        assert res.status_code == 400
        err_data = res.json()
        assert "cannot block their own account" in err_data.get("message", "").lower() or "cannot_block_self" in str(err_data).lower()
