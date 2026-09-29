"""Repository for User database operations."""

from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game_session import GameSession, GameStatus
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

    async def get_by_public_id(self, public_id: str) -> Optional[User]:
        """Fetch a user by opaque UUID public_id."""
        statement = select(User).where(User.public_id == public_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_by_identifier(self, identifier: str) -> Optional[User]:
        """Fetch a user by integer ID, public UUID, or username."""
        if not identifier:
            return None
        
        identifier_str = str(identifier).strip()

        # Try by public_id (UUID format)
        if len(identifier_str) == 36 and "-" in identifier_str:
            user = await self.get_by_public_id(identifier_str)
            if user:
                return user

        # Try by integer ID
        if identifier_str.isdigit():
            user = await self.get_by_id(int(identifier_str))
            if user:
                return user

        # Try by username
        return await self.get_by_username(identifier_str)

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
    ) -> Tuple[List[User], int]:
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

    async def get_overview_stats(self) -> dict:
        """Calculate high-level user statistics across the system."""
        # Total users
        total_stmt = select(func.count(User.id))
        total_res = await self.session.execute(total_stmt)
        total_users = total_res.scalar_one() or 0

        # Active accounts
        active_stmt = select(func.count(User.id)).where(User.is_active.is_(True))
        active_res = await self.session.execute(active_stmt)
        active_users = active_res.scalar_one() or 0

        # Blocked accounts
        blocked_stmt = select(func.count(User.id)).where(User.is_active.is_(False))
        blocked_res = await self.session.execute(blocked_stmt)
        blocked_users = blocked_res.scalar_one() or 0

        # Active in last 7 days
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        active_7d_stmt = (
            select(func.count(func.distinct(User.id)))
            .outerjoin(GameSession, GameSession.player_id == User.id)
            .where(
                (GameSession.started_at >= seven_days_ago)
                | (User.updated_at >= seven_days_ago)
            )
        )
        active_7d_res = await self.session.execute(active_7d_stmt)
        active_7d_users = active_7d_res.scalar_one() or 0

        return {
            "total_users": int(total_users),
            "active_users": int(active_users),
            "blocked_users": int(blocked_users),
            "active_7d_users": int(active_7d_users),
        }

    async def get_user_game_stats(self, user_id: int) -> dict:
        """Aggregate comprehensive gameplay metrics for a given user."""
        stmt = select(
            func.count(GameSession.id).label("total_games"),
            func.coalesce(func.sum(case((GameSession.status == GameStatus.WON, 1), else_=0)), 0).label("games_won"),
            func.coalesce(func.sum(case((GameSession.status == GameStatus.LOST, 1), else_=0)), 0).label("games_lost"),
            func.coalesce(func.sum(case((GameSession.status == GameStatus.EXPIRED, 1), else_=0)), 0).label("games_expired"),
            func.coalesce(func.sum(case((GameSession.status == GameStatus.ACTIVE, 1), else_=0)), 0).label("active_games"),
            func.coalesce(func.sum(GameSession.hints_used), 0).label("hints_used_total"),
            func.coalesce(func.sum(GameSession.attempts_used), 0).label("attempts_used_total"),
            func.max(GameSession.started_at).label("last_game_started_at"),
            func.max(GameSession.completed_at).label("last_game_completed_at"),
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
        average_attempts = round((attempts / total), 1) if total > 0 else 0.0

        # Calculate average duration for completed games
        durations_stmt = select(
            GameSession.started_at,
            GameSession.completed_at
        ).where(
            (GameSession.player_id == user_id) & (GameSession.completed_at.is_not(None))
        )
        durations_res = await self.session.execute(durations_stmt)
        completed_sessions = durations_res.fetchall()
        
        avg_duration_sec = None
        if completed_sessions:
            durations = [
                (s.completed_at - s.started_at).total_seconds()
                for s in completed_sessions
                if s.completed_at and s.started_at
            ]
            if durations:
                avg_duration_sec = round(sum(durations) / len(durations), 1)

        # Calculate current win streak
        streak_stmt = (
            select(GameSession.status)
            .where(
                (GameSession.player_id == user_id)
                & (GameSession.status != GameStatus.ACTIVE)
            )
            .order_by(GameSession.id.desc())
            .limit(20)
        )
        streak_res = await self.session.execute(streak_stmt)
        recent_statuses = [r[0] for r in streak_res.fetchall()]
        
        current_streak = 0
        for st in recent_statuses:
            if st == GameStatus.WON:
                current_streak += 1
            else:
                break

        # Determine last active timestamp
        last_active = row.last_game_completed_at or row.last_game_started_at

        return {
            "total_games": total,
            "games_won": won,
            "games_lost": lost,
            "games_expired": expired,
            "active_games": active,
            "hints_used_total": hints,
            "attempts_used_total": attempts,
            "win_rate": win_rate,
            "average_attempts": average_attempts,
            "average_duration_seconds": avg_duration_sec,
            "current_streak": current_streak,
            "last_active_at": last_active,
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
