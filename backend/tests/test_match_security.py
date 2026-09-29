"""Security and authorization tests for Match identifiers (UUIDv4) and object-level permissions."""

import uuid
import pytest
import httpx
from sqlalchemy import select

from app.main import app
from app.core.security import create_access_token, hash_password
from app.db.session import async_session_factory
from app.models.user import User, UserRole
from app.models.word import Word, DifficultyLevel


@pytest.fixture
async def async_client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


async def get_or_create_test_user(username: str) -> User:
    """Helper to ensure test users exist in DB."""
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                username=username,
                password_hash=hash_password("password123"),
                role=UserRole.PLAYER.value,
                is_active=True,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        return user


async def ensure_word_exists() -> Word:
    """Helper to ensure at least one active word exists."""
    async with async_session_factory() as session:
        result = await session.execute(select(Word).where(Word.is_active.is_(True)).limit(1))
        word = result.scalar_one_or_none()
        if not word:
            word = Word(
                word="apple",
                hint="A sweet fruit",
                difficulty=DifficultyLevel.EASY,
                is_active=True,
            )
            session.add(word)
            await session.commit()
            await session.refresh(word)
        return word


@pytest.mark.asyncio
async def test_match_security_and_authorization(async_client):
    # 1. Setup Test Players
    player_a = await get_or_create_test_user("test_player_a_sec")
    player_b = await get_or_create_test_user("test_player_b_sec")
    await ensure_word_exists()

    token_a, _ = create_access_token(subject=player_a.id, role="PLAYER")
    token_b, _ = create_access_token(subject=player_b.id, role="PLAYER")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 2. Player A starts a new match
    res_start_a = await async_client.post("/api/v1/games", headers=headers_a)
    assert res_start_a.status_code in [200, 201]
    match_a_data = res_start_a.json()["data"]
    public_id_a = match_a_data["public_id"]
    numeric_id_a = match_a_data["id"]

    # Verify public_id is a valid UUIDv4
    uuid_obj = uuid.UUID(public_id_a)
    assert uuid_obj.version == 4

    # 3. Player B starts a new match
    res_start_b = await async_client.post("/api/v1/games", headers=headers_b)
    assert res_start_b.status_code in [200, 201]
    match_b_data = res_start_b.json()["data"]
    public_id_b = match_b_data["public_id"]
    numeric_id_b = match_b_data["id"]

    # Ensure public IDs are unique
    assert public_id_a != public_id_b

    # 4. Player A accessing their own match (Valid Public ID) -> 200 OK
    res_get_a = await async_client.get(f"/api/v1/games/{public_id_a}", headers=headers_a)
    assert res_get_a.status_code == 200
    assert res_get_a.json()["data"]["public_id"] == public_id_a

    # 5. Player A attempting to access Player B's match by public_id -> 404 Not Found (Strict Object-Level Authorization)
    res_forbidden_public = await async_client.get(f"/api/v1/games/{public_id_b}", headers=headers_a)
    assert res_forbidden_public.status_code == 404

    # 6. Player A attempting to access Player B's match by numeric ID -> 404 Not Found
    res_forbidden_numeric = await async_client.get(f"/api/v1/games/{numeric_id_b}", headers=headers_a)
    assert res_forbidden_numeric.status_code == 404

    # 7. Unauthenticated access -> 401 Unauthorized
    res_unauth = await async_client.get(f"/api/v1/games/{public_id_a}")
    assert res_unauth.status_code == 401

    # 8. Invalid public identifiers (malformed UUID / non-existent) -> 404 Not Found
    res_invalid = await async_client.get("/api/v1/games/invalid-uuid-string-12345", headers=headers_a)
    assert res_invalid.status_code == 404

    random_nonexistent_uuid = str(uuid.uuid4())
    res_nonexistent = await async_client.get(f"/api/v1/games/{random_nonexistent_uuid}", headers=headers_a)
    assert res_nonexistent.status_code == 404

    # 9. Unauthorized guess submission: Player A guessing on Player B's match -> 404 Not Found
    res_unauth_guess = await async_client.post(
        f"/api/v1/games/{public_id_b}/guess",
        json={"guess": "apple"},
        headers=headers_a,
    )
    assert res_unauth_guess.status_code == 404

    # 10. Unauthorized hint request: Player A requesting hint on Player B's match -> 404 Not Found
    res_unauth_hint = await async_client.post(
        f"/api/v1/games/{public_id_b}/hint",
        headers=headers_a,
    )
    assert res_unauth_hint.status_code == 404

    # 11. Refreshing valid public match URLs (repeated requests) -> 200 OK
    res_refresh = await async_client.get(f"/api/v1/games/{public_id_a}", headers=headers_a)
    assert res_refresh.status_code == 200
    assert res_refresh.json()["data"]["public_id"] == public_id_a

    # 12. Player history includes public_id for all matches
    res_history = await async_client.get("/api/v1/games/history", headers=headers_a)
    assert res_history.status_code == 200
    items = res_history.json()["data"]["items"]
    assert len(items) > 0
    for item in items:
        assert "public_id" in item
        assert len(item["public_id"]) == 36
        uuid.UUID(item["public_id"])  # must be valid UUID
