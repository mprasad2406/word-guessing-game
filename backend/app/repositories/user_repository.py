"""Repository for User database operations."""

from typing import Optional
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole


class UserRepository:
    """Encapsulates async database operations for User entities."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Fetch a user by primary key ID."""
        statement = select(User).where(User.id == user_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        """Fetch a user by normalized username."""
        statement = select(User).where(User.username == username)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def exists_by_username(self, username: str) -> bool:
        """Check whether a username is already taken."""
        user = await self.get_by_username(username)
        return user is not None

    async def create(
        self,
        username: str,
        password_hash: str,
        role: UserRole = UserRole.PLAYER,
    ) -> User:
        """Create and persist a new user entity."""
        user = User(
            username=username,
            password_hash=password_hash,
            role=role,
            is_active=True,
        )
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def list_users(
        self,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[User], int]:
        """List paginated users with optional role, active status, and username search filters."""
        query = select(User)
        count_query = select(func.count(User.id))

        if role is not None:
            query = query.where(User.role == role)
            count_query = count_query.where(User.role == role)

        if is_active is not None:
            query = query.where(User.is_active.is_(is_active))
            count_query = count_query.where(User.is_active.is_(is_active))

        if search and search.strip():
            pattern = f"%{search.strip().lower()}%"
            query = query.where(User.username.ilike(pattern))
            count_query = count_query.where(User.username.ilike(pattern))

        total_res = await self.session.execute(count_query)
        total = total_res.scalar_one()

        offset = (page - 1) * page_size
        query = query.order_by(User.id.desc()).offset(offset).limit(page_size)
        items_res = await self.session.execute(query)
        users = list(items_res.scalars().all())

        return users, total

    async def get_user_game_stats(self, user_id: int) -> dict:
        """Aggregate gameplay metrics for a given user."""
        from app.models.game_session import GameSession, GameStatus

        stmt = select(
            func.count(GameSession.id).label("total_games"),
            func.coalesce(func.sum(case((GameSession.status == GameStatus.WON, 1), else_=0)), 0).label("games_won"),
            func.coalesce(func.sum(case((GameSession.status == GameStatus.LOST, 1), else_=0)), 0).label("games_lost"),
            func.coalesce(func.sum(case((GameSession.status == GameStatus.EXPIRED, 1), else_=0)), 0).label("games_expired"),
            func.coalesce(func.sum(case((GameSession.status == GameStatus.ACTIVE, 1), else_=0)), 0).label("active_games"),
            func.coalesce(func.sum(GameSession.hints_used), 0).label("hints_used_total"),
            func.coalesce(func.sum(GameSession.attempts_used), 0).label("attempts_used_total"),
        ).where(GameSession.player_id == user_id)

        res = await self.session.execute(stmt)
        row = res.one()

        total = int(row.total_games or 0)
        won = int(row.games_won or 0)
        lost = int(row.games_lost or 0)
        expired = int(row.games_expired or 0)
        active = int(row.active_games or 0)
        hints = int(row.hints_used_total or 0)
        attempts = int(row.attempts_used_total or 0)
        win_rate = round((won / total * 100), 1) if total > 0 else 0.0

        return {
            "total_games": total,
            "games_won": won,
            "games_lost": lost,
            "games_expired": expired,
            "active_games": active,
            "hints_used_total": hints,
            "attempts_used_total": attempts,
            "win_rate": win_rate,
        }

    async def update_status(self, user_id: int, is_active: bool) -> Optional[User]:
        """Update a user's active/blocked status."""
        user = await self.get_by_id(user_id)
        if not user:
            return None
        user.is_active = is_active
        await self.session.flush()
        await self.session.refresh(user)
        return user
