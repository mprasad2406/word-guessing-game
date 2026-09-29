import pytest
import httpx
from app.main import app
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_admin_reports_endpoints():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        admin_token, _ = create_access_token(subject=1, role="ADMIN")
        headers = {"Authorization": f"Bearer {admin_token}"}

        # 1. Test Daily Reports
        res = await ac.get("/api/v1/admin/reports/daily?page=1&page_size=20", headers=headers)
        assert res.status_code == 200
        data = res.json()["data"]
        assert "summaries" in data
        assert "total" in data

        if len(data["summaries"]) > 0:
            first_day = data["summaries"][0]
            assert "date" in first_day
            assert "number_of_users" in first_day
            assert "total_games" in first_day
            assert "games_won" in first_day
            assert "win_rate" in first_day
            assert "total_guesses" in first_day

            # 2. Test Daily Details for that day
            day_str = str(first_day["date"])
            res_details = await ac.get(f"/api/v1/admin/reports/daily/{day_str}/details?page=1&page_size=10", headers=headers)
            assert res_details.status_code == 200
            details_data = res_details.json()["data"]
            assert "sessions" in details_data
            assert "total" in details_data

        # 3. Test User Reports
        res_user_reports = await ac.get("/api/v1/admin/reports/users?page=1&page_size=20", headers=headers)
        assert res_user_reports.status_code == 200
        user_reports_data = res_user_reports.json()["data"]
        assert "summaries" in user_reports_data
        assert "total" in user_reports_data

        # 4. Test Daily PDF Generation & Download (Comprehensive)
        res_pdf_daily = await ac.get("/api/v1/admin/reports/pdf/daily", headers=headers)
        assert res_pdf_daily.status_code == 200
        assert res_pdf_daily.headers["content-type"] == "application/pdf"
        assert res_pdf_daily.content.startswith(b"%PDF-")
        assert "attachment; filename=" in res_pdf_daily.headers.get("content-disposition", "")

        # 5. Test Daily PDF with Summary-Only and Password Encryption
        res_pdf_daily_sec = await ac.get(
            "/api/v1/admin/reports/pdf/daily?summary_only=true&password=SecureReportPass123",
            headers=headers,
        )
        assert res_pdf_daily_sec.status_code == 200
        assert res_pdf_daily_sec.headers["content-type"] == "application/pdf"
        assert res_pdf_daily_sec.content.startswith(b"%PDF-")

        # 6. Test Player PDF Generation & Download
        res_pdf_player = await ac.get("/api/v1/admin/reports/pdf/player?player=1", headers=headers)
        assert res_pdf_player.status_code == 200
        assert res_pdf_player.headers["content-type"] == "application/pdf"
        assert res_pdf_player.content.startswith(b"%PDF-")
        assert "attachment; filename=" in res_pdf_player.headers.get("content-disposition", "")

        # 7. Test Player PDF with Summary-Only and Password Encryption
        res_pdf_player_sec = await ac.get(
            "/api/v1/admin/reports/pdf/player?player=1&summary_only=true&password=SecretPass456",
            headers=headers,
        )
        assert res_pdf_player_sec.status_code == 200
        assert res_pdf_player_sec.headers["content-type"] == "application/pdf"
        assert res_pdf_player_sec.content.startswith(b"%PDF-")

        # 8. Test Daily Report Dataset for Frontend React Rendering
        res_data_daily = await ac.get("/api/v1/admin/reports/data/daily", headers=headers)
        assert res_data_daily.status_code == 200
        daily_payload = res_data_daily.json()["data"]
        assert "period" in daily_payload
        assert "summary" in daily_payload
        assert "outcome_distribution" in daily_payload
        assert "daily_summaries" in daily_payload
        assert "player_participation" in daily_payload
        assert "word_statistics" in daily_payload
        assert "sessions" in daily_payload

        # 9. Test Player Report Dataset for Frontend React Rendering
        res_data_player = await ac.get("/api/v1/admin/reports/data/player?player=1", headers=headers)
        assert res_data_player.status_code == 200
        player_payload = res_data_player.json()["data"]
        assert "period" in player_payload
        assert "user_profile" in player_payload
        assert "lifetime_stats" in player_payload
        assert "period_stats" in player_payload
        assert "attempts_distribution" in player_payload
        assert "daily_records" in player_payload
        assert "sessions" in player_payload

        # 10. Test Unauthorized & Non-Admin Access
        res_unauth = await ac.get("/api/v1/admin/reports/pdf/daily")
        assert res_unauth.status_code == 401

        user_token, _ = create_access_token(subject=2, role="PLAYER")
        res_forbidden = await ac.get("/api/v1/admin/reports/pdf/daily", headers={"Authorization": f"Bearer {user_token}"})
        assert res_forbidden.status_code == 403
