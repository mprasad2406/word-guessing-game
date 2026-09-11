"""Service for Game creation, whole-word guessing, hints, and player history."""

from datetime import datetime, timezone
from typing import Optional

from app.core.exceptions import (
    DailyLimitReachedException,
    GameAlreadyCompletedException,
    GameDisabledException,
    GameNotFoundException,
    InvalidGuessLengthException,
    MaxHintsReachedException,
    NoEligibleWordsException,
    NoHintAvailableException,
    RepeatedGuessNotAllowedException,
)
from app.models.game_session import GameSession, GameStatus
from app.models.user import User, UserRole
from app.models.word import DifficultyLevel
from app.repositories.game_session_repository import GameSessionRepository
from app.repositories.game_settings_repository import GameSettingsRepository
from app.repositories.guess_repository import GuessRepository
from app.schemas.gameplay import (
    DailyQuotaResponse,
    GameHistoryItem,
    GameHistoryResponse,
    GameStateResponse,
    GuessItem,
    HintResponse,
)

DAILY_WORD_LIMIT = 3


def compute_letter_feedback(target_word: str, guess_word: str) -> list:
    """
    Computes Wordle-style feedback for each letter in guess_word against target_word.
    Returns a list of 'correct' (green), 'present' (orange), 'absent' (grey).
    Correctly handles duplicate letters using the standard two-pass algorithm.
    """
    target = list(target_word.lower())
    guess = list(guess_word.lower())
    n = len(guess)
    feedback = ["absent"] * n

    target_counts = {}

    # Pass 1: exact matches (green)
    for i in range(n):
        if i < len(target) and guess[i] == target[i]:
            feedback[i] = "correct"
        elif i < len(target):
            char = target[i]
            target_counts[char] = target_counts.get(char, 0) + 1

    # Pass 2: misplaced matches (orange)
    for i in range(n):
        if feedback[i] != "correct":
            char = guess[i]
            if target_counts.get(char, 0) > 0:
                feedback[i] = "present"
                target_counts[char] -= 1
            else:
                feedback[i] = "absent"

    return feedback


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure a datetime object is timezone-aware UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class GameplayService:
    # ... Existing class methods ...
    """Business logic service for player gameplay."""

    def __init__(
        self,
        game_session_repo: GameSessionRepository,
        guess_repo: GuessRepository,
        settings_repo: GameSettingsRepository,
    ) -> None:
        self.game_session_repo = game_session_repo
        self.guess_repo = guess_repo
        self.settings_repo = settings_repo

    async def calculate_adaptive_difficulty(self, player_id: int) -> DifficultyLevel:
        """
        Dynamically adapts word difficulty based on the player's recent game performance:
        1. Analyzes recent completed game sessions (up to last 5 games).
        2. High performance (Elevate to HARD):
           - Won last 2+ consecutive games, OR
           - Won last game in <= 3 attempts, OR
           - Win rate >= 75% in recent games.
        3. Struggling performance (Adjust to EASY):
           - Lost last 2 consecutive games, OR
           - Lost last game, OR
           - Win rate <= 33% in recent games.
        4. Balanced / New player performance -> MEDIUM (or EASY if 0 games played).
        """
        recent_sessions = await self.game_session_repo.get_player_recent_sessions(player_id=player_id, limit=5)
        if not recent_sessions:
            return DifficultyLevel.EASY

        recent_statuses = [s.status for s in recent_sessions]
        recent_wins = sum(1 for st in recent_statuses if st == GameStatus.WON)
        total_recent = len(recent_statuses)
        win_rate = recent_wins / total_recent if total_recent > 0 else 0.0

        last_game = recent_sessions[0]
        is_last_win = last_game.status == GameStatus.WON
        last_attempts = last_game.attempts_used

        # Calculate win streak
        win_streak = 0
        for st in recent_statuses:
            if st == GameStatus.WON:
                win_streak += 1
            else:
                break

        # Calculate lose streak
        lose_streak = 0
        for st in recent_statuses:
            if st in (GameStatus.LOST, GameStatus.EXPIRED):
                lose_streak += 1
            else:
                break

        # High performance: User is answering correctly and quickly
        if win_streak >= 2 or (is_last_win and last_attempts <= 3) or (total_recent >= 3 and win_rate >= 0.75):
            return DifficultyLevel.HARD

        # Struggling: User lost or is failing attempts
        if lose_streak >= 1 or (not is_last_win) or (total_recent >= 3 and win_rate <= 0.35):
            return DifficultyLevel.EASY

        return DifficultyLevel.MEDIUM

    async def get_player_daily_quota(self, player_id: int) -> DailyQuotaResponse:
        """Get player daily game quota status (configurable limit, 0 = infinite)."""
        settings = await self.settings_repo.get_or_create_default()
        limit = getattr(settings, "daily_word_limit", 3)
        games_today = await self.game_session_repo.count_player_games_today(player_id)

        if limit == 0:
            return DailyQuotaResponse(
                daily_limit=0,
                games_played_today=games_today,
                games_remaining_today=None,
                can_start_game=True,
                is_unlimited=True,
            )

        remaining = max(0, limit - games_today)
        return DailyQuotaResponse(
            daily_limit=limit,
            games_played_today=games_today,
            games_remaining_today=remaining,
            can_start_game=(remaining > 0),
            is_unlimited=False,
        )

    async def create_game(self, player_id: int) -> GameStateResponse:
        """
        Start a new game session for the authenticated player.
        Enforces global game status, dynamic daily quota, word eligibility, and adaptive difficulty.
        """
        settings = await self.settings_repo.get_or_create_default()
        if not settings.game_enabled:
            raise GameDisabledException("Game is currently disabled by the administrator")

        # Enforce configurable daily limit: 0 = infinite, >0 = limit
        limit = getattr(settings, "daily_word_limit", 3)
        if limit > 0:
            games_today = await self.game_session_repo.count_player_games_today(player_id)
            if games_today >= limit:
                raise DailyLimitReachedException(
                    f"Daily limit reached. You can only guess up to {limit} words per day. Please come back tomorrow!"
                )

        # Determine adaptive difficulty for this player
        adaptive_difficulty = await self.calculate_adaptive_difficulty(player_id=player_id)

        # Select word matching length, adaptive difficulty, and player reuse configuration
        word = await self.game_session_repo.find_eligible_word(
            min_len=settings.min_word_length,
            max_len=settings.max_word_length,
            difficulty=adaptive_difficulty,
            allow_reuse=settings.allow_word_reuse,
            player_id=player_id,
        )
        if not word:
            raise NoEligibleWordsException(
                "No eligible words available for gameplay under current settings"
            )

        # Store immutable settings snapshot in session
        settings_snapshot = {
            "max_attempts": settings.max_attempts,
            "min_word_length": settings.min_word_length,
            "max_word_length": settings.max_word_length,
            "default_difficulty": adaptive_difficulty.value,
            "max_hints": settings.max_hints,
            "time_limit_seconds": settings.time_limit_seconds,
            "scoring_multiplier": settings.scoring_multiplier,
            "allow_repeated_guesses": settings.allow_repeated_guesses,
            "allow_word_reuse": settings.allow_word_reuse,
        }

        session = await self.game_session_repo.create_session(
            player_id=player_id,
            word_id=word.id,
            max_attempts=settings.max_attempts,
            settings_snapshot=settings_snapshot,
        )

        return self._build_game_state_response(session, word_text=word.word)

    async def get_game_state(
        self,
        session_id: int,
        current_user: User,
    ) -> GameStateResponse:
        """Retrieve current state of a game session. Strictly restricts access to game owner or admin."""
        session = await self.game_session_repo.get_session_by_id(session_id)
        if not session:
            raise GameNotFoundException(f"Game session {session_id} not found")

        # Enforce player ownership strictly
        if session.player_id != current_user.id:
            raise GameNotFoundException(f"Game session {session_id} not found")

        # Check time limit expiration if game is currently ACTIVE
        await self._check_time_limit_expiration(session)

        return self._build_game_state_response(session, word_text=session.word.word)

    async def submit_guess(
        self,
        session_id: int,
        guess_text: str,
        player_id: int,
    ) -> GameStateResponse:
        """
        Submit a whole-word guess attempt against an active game session.
        Acquires row-level lock to ensure atomic attempt tracking.
        """
        session = await self.game_session_repo.get_session_by_id(session_id, for_update=True)
        if not session or session.player_id != player_id:
            raise GameNotFoundException(f"Game session {session_id} not found")

        # Check time limit expiration first
        if await self._check_time_limit_expiration(session):
            return self._build_game_state_response(session, word_text=session.word.word)

        if session.status != GameStatus.ACTIVE:
            raise GameAlreadyCompletedException(
                f"Game is already {session.status.value}. No more guesses permitted."
            )

        cleaned_guess = guess_text.strip().lower()
        target_word = session.word.word

        # Validate guess length matches the secret word
        if len(cleaned_guess) != len(target_word):
            raise InvalidGuessLengthException(
                f"Guess must be exactly {len(target_word)} letters long"
            )

        # Enforce repeated guess rules from immutable snapshot
        allow_repeated = session.settings_snapshot.get("allow_repeated_guesses", False)
        if not allow_repeated:
            existing_guesses = {g.guess for g in session.guesses}
            if cleaned_guess in existing_guesses:
                raise RepeatedGuessNotAllowedException(
                    f"Repeated guess '{cleaned_guess}' is not allowed in this game session"
                )

        # Evaluate whole-word guess
        is_correct = (cleaned_guess == target_word)
        session.attempts_used += 1

        # Record guess attempt
        guess_entity = await self.guess_repo.create_guess(
            game_session_id=session.id,
            guess=cleaned_guess,
            is_correct=is_correct,
            attempt_number=session.attempts_used,
        )
        session.guesses.append(guess_entity)

        # Update win / loss state
        now = datetime.now(timezone.utc)
        if is_correct:
            session.status = GameStatus.WON
            session.completed_at = now
        elif session.attempts_used >= session.max_attempts:
            session.status = GameStatus.LOST
            session.completed_at = now

        return self._build_game_state_response(session, word_text=target_word)

    async def request_hint(
        self,
        session_id: int,
        player_id: int,
    ) -> HintResponse:
        """
        Request the hint for the current game session.
        Enforces immutable hint quota and avoids charging repeatedly for already revealed hints.
        """
        session = await self.game_session_repo.get_session_by_id(session_id, for_update=True)
        if not session or session.player_id != player_id:
            raise GameNotFoundException(f"Game session {session_id} not found")

        # Check time limit expiration first
        if await self._check_time_limit_expiration(session):
            raise GameAlreadyCompletedException("Time limit has expired for this game session")

        if session.status != GameStatus.ACTIVE:
            raise GameAlreadyCompletedException("Hints are only available for active games")

        if not session.word.hint or not session.word.hint.strip():
            raise NoHintAvailableException("No hint is available for this word")

        max_hints = session.settings_snapshot.get("max_hints", 0)

        # If hint was already revealed for this session, return it without charging again
        if session.hint_revealed:
            return HintResponse(
                hint=session.word.hint,
                hints_used=session.hints_used,
                hints_remaining=max(0, max_hints - session.hints_used),
            )

        # Enforce hint limit
        if session.hints_used >= max_hints:
            raise MaxHintsReachedException("Maximum hints limit reached for this game session")

        session.hints_used += 1
        session.hint_revealed = True

        return HintResponse(
            hint=session.word.hint,
            hints_used=session.hints_used,
            hints_remaining=max(0, max_hints - session.hints_used),
        )

    async def get_player_history(
        self,
        player_id: int,
        status: Optional[GameStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> GameHistoryResponse:
        """
        Retrieve paginated game history for the authenticated player.
        Automatically checks and marks timed-out active sessions as EXPIRED upon fetch.
        """
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        # Auto-expire any active games for this player that exceeded the time limit
        await self._expire_player_active_sessions(player_id)

        sessions, total = await self.game_session_repo.list_player_sessions(
            player_id=player_id,
            status=status,
            page=page,
            page_size=page_size,
        )
        pages = (total + page_size - 1) // page_size if total > 0 else 1

        history_items = []
        for s in sessions:
            # Conceal word if still active, reveal only if game completed
            final_word = s.word.word if s.status != GameStatus.ACTIVE else None
            started_utc = _ensure_utc(s.started_at)
            completed_utc = _ensure_utc(s.completed_at)
            duration_secs = None
            if started_utc and completed_utc:
                duration_secs = max(0, int((completed_utc - started_utc).total_seconds()))
            history_items.append(
                GameHistoryItem(
                    id=s.id,
                    status=s.status,
                    word_length=len(s.word.word),
                    max_attempts=s.max_attempts,
                    attempts_used=s.attempts_used,
                    hints_used=s.hints_used,
                    started_at=started_utc,
                    completed_at=completed_utc,
                    final_word=final_word,
                    duration_seconds=duration_secs,
                )
            )

        return GameHistoryResponse(
            items=history_items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def _expire_player_active_sessions(self, player_id: int) -> None:
        """Check all active sessions for player and mark expired ones as GameStatus.EXPIRED."""
        active_sessions = await self.game_session_repo.get_active_sessions_for_player(player_id)
        for session in active_sessions:
            await self._check_time_limit_expiration(session)

    async def _check_time_limit_expiration(self, session: GameSession) -> bool:
        """Check and apply time limit expiration if game is ACTIVE and exceeded allowed duration."""
        if session.status != GameStatus.ACTIVE:
            return False

        time_limit = session.settings_snapshot.get("time_limit_seconds")
        if time_limit and time_limit > 0:
            started_at = _ensure_utc(session.started_at)
            now = datetime.now(timezone.utc)
            elapsed = (now - started_at).total_seconds()
            if elapsed > time_limit:
                session.status = GameStatus.EXPIRED
                session.completed_at = now
                return True
        return False

    def _build_game_state_response(
        self,
        session: GameSession,
        word_text: str,
    ) -> GameStateResponse:
        """
        Build a safe GameStateResponse.
        Masks the hidden word while ACTIVE and reveals it only upon completion.
        """
        is_completed = session.status != GameStatus.ACTIVE
        word_length = len(word_text)

        if is_completed:
            final_word = word_text
            masked_pattern = " ".join(list(word_text))
        else:
            final_word = None
            masked_pattern = " ".join(["_"] * word_length)

        max_hints = session.settings_snapshot.get("max_hints", 0)
        hints_remaining = max(0, max_hints - session.hints_used)
        revealed_hint = session.word.hint if session.hint_revealed else None

        started_at = _ensure_utc(session.started_at)
        completed_at = _ensure_utc(session.completed_at)

        time_limit = session.settings_snapshot.get("time_limit_seconds")
        time_remaining = None
        if time_limit and time_limit > 0:
            now = datetime.now(timezone.utc)
            if session.status == GameStatus.ACTIVE:
                elapsed = (now - started_at).total_seconds()
                time_remaining = max(0, int(time_limit - elapsed))
            else:
                time_remaining = 0

        guess_items = [
            GuessItem(
                guess=g.guess,
                is_correct=g.is_correct,
                attempt_number=g.attempt_number,
                created_at=_ensure_utc(g.created_at),
                letter_feedback=compute_letter_feedback(session.word.word, g.guess),
            )
            for g in session.guesses
        ]

        return GameStateResponse(
            id=session.id,
            status=session.status,
            word_length=word_length,
            masked_pattern=masked_pattern,
            max_attempts=session.max_attempts,
            attempts_used=session.attempts_used,
            remaining_attempts=max(0, session.max_attempts - session.attempts_used),
            max_hints=max_hints,
            hints_used=session.hints_used,
            hints_remaining=hints_remaining,
            revealed_hint=revealed_hint,
            guesses=guess_items,
            started_at=started_at,
            completed_at=completed_at,
            final_word=final_word,
            time_limit_seconds=time_limit,
            time_remaining_seconds=time_remaining,
        )
