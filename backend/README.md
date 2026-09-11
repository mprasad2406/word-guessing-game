# Guess the Word — Backend

This repository contains the production-grade **FastAPI** backend for **Guess the Word** with **MySQL** database.

* **Phase 1**: Authentication & Core Foundation (Completed)
* **Stage 2**: Core Game Foundation & Admin-Configurable Game Settings (Completed)
* **Stage 3**: Game Creation and Guessing Gameplay APIs (Completed)

---

## 1. Architecture & Layer Responsibilities

The application follows a **Modular Monolith** architecture adhering to SOLID principles, separation of concerns, and dependency injection:

```text
backend/
├── app/
│   ├── main.py                     # Application factory, CORS, exception handlers
│   ├── core/
│   │   ├── config.py               # Pydantic Settings (environment variables)
│   │   ├── security.py             # Argon2id password/secret hashing & JWT token operations
│   │   ├── exceptions.py           # Domain exceptions and standard error codes
│   │   └── rate_limit.py           # SlowAPI rate limiter setup
│   ├── db/
│   │   ├── base.py                 # SQLAlchemy 2.0 DeclarativeBase and TimestampMixin
│   │   └── session.py              # Async SQLAlchemy engine & session factory (MySQL pool_recycle)
│   ├── models/
│   │   ├── user.py                 # User ORM model & UserRole enum (PLAYER, ADMIN)
│   │   ├── word.py                 # Word ORM model & DifficultyLevel enum
│   │   ├── game_settings.py        # GameSettings singleton model
│   │   ├── game_session.py         # GameSession ORM model & GameStatus enum
│   │   ├── guess.py                # Guess ORM model (attempt tracking)
│   │   ├── admin_security.py       # AdminSecuritySettings singleton model
│   │   └── audit_log.py            # AuditLog ORM model
│   ├── schemas/
│   │   ├── common.py               # Standardized ApiResponse[T] & ApiError schemas
│   │   ├── user.py                 # UserResponse public schema
│   │   ├── auth.py                 # RegisterRequest, LoginRequest, TokenResponse schemas
│   │   ├── word.py                 # WordCreate, WordUpdate, PermanentDeleteWord, WordResponse
│   │   ├── game_settings.py        # GameSettingsResponse, GameSettingsUpdateRequest
│   │   ├── game_session.py         # Safe GameSessionResponse (excluding hidden word)
│   │   ├── gameplay.py             # GuessRequest, GameStateResponse, HintResponse, GameHistoryResponse
│   │   └── admin_security.py       # SetAdminSecretRequest, AdminSecretStatusResponse
│   ├── repositories/
│   │   ├── user_repository.py      # Data access layer for User entities
│   │   ├── word_repository.py      # Data access layer for Word entities
│   │   ├── game_settings_repository.py # Data access layer for GameSettings singleton
│   │   ├── game_session_repository.py # Data access layer for GameSession entities
│   │   ├── guess_repository.py     # Data access layer for Guess entities
│   │   ├── admin_security_repository.py # Data access layer for AdminSecuritySettings
│   │   └── audit_log_repository.py # Data access layer for AuditLog records
│   ├── services/
│   │   ├── auth_service.py         # Business logic: registration, authentication, tokens
│   │   ├── word_service.py         # Business logic: word validation, CRUD, soft/hard delete
│   │   ├── game_settings_service.py # Business logic: settings retrieval and validation
│   │   ├── gameplay_service.py     # Business logic: game creation, whole-word guessing, hints, history
│   │   ├── admin_security_service.py # Business logic: Argon2id security key verification
│   │   └── audit_service.py        # Business logic: transactional audit logging
│   ├── api/
│   │   ├── router.py               # Main API v1 router
│   │   └── routes/
│   │       ├── health.py           # GET /health
│   │       ├── auth.py             # POST /register, POST /login, GET /me
│   │       ├── games.py            # POST /games, GET /games/{id}, POST /guess, POST /hint, GET /history
│   │       └── admin/
│   │           ├── words.py        # Word management endpoints (Admin only)
│   │           ├── game_settings.py # Game settings endpoints (Admin only)
│   │           └── security.py     # Admin security key setup/rotate (Admin only)
│   ├── dependencies/
│   │   ├── database.py             # Database session, repository & service injection
│   │   ├── authentication.py       # JWT extraction & current user resolution
│   │   └── authorization.py        # Role-based access control dependencies (require_admin)
│   └── utils/
│       └── validators.py           # Username & password validation rules
├── alembic/
│   ├── versions/
│   │   ├── 0001_initial_users_table.py
│   │   ├── 0002_game_foundation_and_admin_settings.py
│   │   └── 0003_guesses_and_hint_tracking.py
│   └── env.py                      # Async migration runner
├── alembic.ini                     # Alembic configuration
├── requirements.txt                # Python dependencies (asyncmy, pymysql)
├── .env.example                    # Environment variables template (MySQL)
├── .env                            # Local configuration (MySQL)
├── .gitignore                      # Git ignore rules
└── README.md                       # Documentation
```

---

## 2. API Endpoints

### Public & Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Service health status check | No |
| `POST` | `/api/v1/auth/register` | Register a new player account | No |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT access token | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Bearer Token |

### Gameplay Endpoints (Player & Admin)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/games` | Start a new game session | Bearer Token |
| `GET` | `/api/v1/games/history` | List authenticated player's game history | Bearer Token |
| `GET` | `/api/v1/games/{game_id}` | Retrieve game state (masked word pattern) | Bearer Token |
| `POST` | `/api/v1/games/{game_id}/guess` | Submit a whole-word guess attempt | Bearer Token |
| `POST` | `/api/v1/games/{game_id}/hint` | Request a hint for the active game | Bearer Token |

### Admin Endpoints (Requires ADMIN Role)
| Method | Endpoint | Description | Critical Key Required? |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/admin/words` | Create a new word | No |
| `GET` | `/api/v1/admin/words` | List words with filters & pagination | No |
| `GET` | `/api/v1/admin/words/{word_id}` | Get word details | No |
| `PATCH` | `/api/v1/admin/words/{word_id}` | Update word details | No |
| `DELETE` | `/api/v1/admin/words/{word_id}` | Soft-delete (deactivate) a word | No |
| `POST` | `/api/v1/admin/words/{word_id}/permanent-delete` | Irreversibly delete a word | **Yes (`security_key`)** |
| `GET` | `/api/v1/admin/game-settings` | View current game settings | No |
| `PATCH` | `/api/v1/admin/game-settings` | Update game settings | **Yes (if critical field changed)** |
| `GET` | `/api/v1/admin/security/status` | Check if security key is initialized | No |
| `POST` | `/api/v1/admin/security/secret-key` | Initialize or rotate admin security key | **Yes (current key if rotating)** |

---

## 3. Database Configuration (MySQL)

Configure MySQL in `.env`:
```ini
DATABASE_URL=mysql+asyncmy://root:password@localhost:3306/guess_the_word
```

*(Note: Create the database in MySQL before running migrations: `CREATE DATABASE guess_the_word CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)*.

---

## 4. Local Execution & Migrations

```powershell
# 1. Activate virtual environment
.venv\Scripts\Activate.ps1

# 2. Install MySQL async driver
pip install -r requirements.txt

# 3. Run database migrations to latest on MySQL
alembic upgrade head

# 4. Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive OpenAPI Swagger documentation: `http://localhost:8000/api/docs`.
