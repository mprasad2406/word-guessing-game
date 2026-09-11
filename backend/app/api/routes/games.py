"""API routes for player game sessions, whole-word guessing, hints, and history."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.dependencies.authorization import require_player
from app.dependencies.database import get_gameplay_service
from app.models.game_session import GameStatus
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.gameplay import (
    DailyQuotaResponse,
    GameHistoryResponse,
    GameStateResponse,
    GuessRequest,
    HintResponse,
)
from app.services.gameplay_service import GameplayService

router = APIRouter(prefix="/games", tags=["Games & Gameplay"])


@router.get(
    "/daily-quota",
    response_model=ApiResponse[DailyQuotaResponse],
    status_code=status.HTTP_200_OK,
    summary="Get player daily game quota",
    description="Retrieves the player's daily word guessing quota (max 3 words per day) and remaining quota for today.",
)
async def get_daily_quota(
    current_player: User = Depends(require_player),
    gameplay_service: GameplayService = Depends(get_gameplay_service),
) -> ApiResponse[DailyQuotaResponse]:
    """Retrieve player daily game quota."""
    quota = await gameplay_service.get_player_daily_quota(player_id=current_player.id)
    return ApiResponse.success_response(
        data=quota,
        message="Daily quota retrieved successfully",
    )


@router.post(
    "",
    response_model=ApiResponse[GameStateResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Start a new game",
    description="Initializes a new game session, randomly selecting an eligible word and capturing settings. Restricted to players.",
)
async def start_game(
    current_player: User = Depends(require_player),
    gameplay_service: GameplayService = Depends(get_gameplay_service),
) -> ApiResponse[GameStateResponse]:
    """Create and start a new game session."""
    game_state = await gameplay_service.create_game(player_id=current_player.id)
    return ApiResponse.success_response(
        data=game_state,
        message="Game started successfully",
    )


@router.get(
    "/history",
    response_model=ApiResponse[GameHistoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get player game history",
    description="Retrieves a paginated list of games played by the authenticated player. Restricted to players.",
)
async def get_game_history(
    status: Optional[GameStatus] = Query(None, description="Filter by game status (ACTIVE, WON, LOST, EXPIRED)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_player: User = Depends(require_player),
    gameplay_service: GameplayService = Depends(get_gameplay_service),
) -> ApiResponse[GameHistoryResponse]:
    """Retrieve player game history."""
    history = await gameplay_service.get_player_history(
        player_id=current_player.id,
        status=status,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success_response(
        data=history,
        message="Game history retrieved successfully",
    )


@router.get(
    "/{game_id}",
    response_model=ApiResponse[GameStateResponse],
    status_code=status.HTTP_200_OK,
    summary="Get current game state",
    description="Retrieves current game progress, remaining attempts, and guesses. Restricted to game owner player.",
)
async def get_game_state(
    game_id: int,
    current_player: User = Depends(require_player),
    gameplay_service: GameplayService = Depends(get_gameplay_service),
) -> ApiResponse[GameStateResponse]:
    """Retrieve state of an ongoing or completed game."""
    game_state = await gameplay_service.get_game_state(
        session_id=game_id,
        current_user=current_player,
    )
    return ApiResponse.success_response(
        data=game_state,
        message="Game state retrieved successfully",
    )


@router.post(
    "/{game_id}/guess",
    response_model=ApiResponse[GameStateResponse],
    status_code=status.HTTP_200_OK,
    summary="Submit a whole-word guess",
    description="Submits a word guess against an active game session. Updates attempts and detects win/loss. Restricted to players.",
)
async def submit_guess(
    game_id: int,
    payload: GuessRequest,
    current_player: User = Depends(require_player),
    gameplay_service: GameplayService = Depends(get_gameplay_service),
) -> ApiResponse[GameStateResponse]:
    """Submit a whole-word guess attempt."""
    game_state = await gameplay_service.submit_guess(
        session_id=game_id,
        guess_text=payload.guess,
        player_id=current_player.id,
    )
    message = "Correct guess! You won!" if game_state.status == GameStatus.WON else "Guess recorded"
    if game_state.status == GameStatus.LOST:
        message = "Attempts exhausted. Game over."
    return ApiResponse.success_response(
        data=game_state,
        message=message,
    )


@router.post(
    "/{game_id}/hint",
    response_model=ApiResponse[HintResponse],
    status_code=status.HTTP_200_OK,
    summary="Request a hint",
    description="Reveals the configured word hint. Enforces hint quota from the immutable session settings snapshot. Restricted to players.",
)
async def request_hint(
    game_id: int,
    current_player: User = Depends(require_player),
    gameplay_service: GameplayService = Depends(get_gameplay_service),
) -> ApiResponse[HintResponse]:
    """Request a hint for the current game session."""
    hint_result = await gameplay_service.request_hint(
        session_id=game_id,
        player_id=current_player.id,
    )
    return ApiResponse.success_response(
        data=hint_result,
        message="Hint retrieved successfully",
    )
