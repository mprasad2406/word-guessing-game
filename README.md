# <img src="https://api.iconify.design/lucide:gamepad-2.svg?color=%234f46e5" width="34" height="34" style="vertical-align: middle; margin-right: 8px;" /> Word Guessing Game (Enterprise Full-Stack Platform)

<p align="left">
  <img src="https://img.shields.io/badge/Python-3.12%2B-blue.svg?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF.svg?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0%20(Async)-red.svg?logo=sqlalchemy&logoColor=white" alt="SQLAlchemy" />
  <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3.svg?logo=bootstrap&logoColor=white" alt="Bootstrap" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

An enterprise-grade, asynchronous **Word Guessing Game** platform built using **Python FastAPI** and **React + Vite**. It features server-authoritative gameplay mechanics, role-based access control (RBAC), an administrative control center, dictionary management, live user moderation, dynamic game security, and a server-side **PDF analytics export engine**.

---

## <img src="https://api.iconify.design/lucide:table-of-contents.svg?color=%233b82f6" width="22" height="22" style="vertical-align: middle;" /> Table of Contents
1. [Visual Showcase & Screenshots](#-visual-showcase--screenshots)
2. [Image Placement Guide](#-image-placement-guide)
3. [Deep-Dive Feature Breakdown](#-deep-dive-feature-breakdown)
   - [Gameplay Engine & Mechanics](#1-gameplay-engine--mechanics)
   - [Player Portal & Experience](#2-player-portal--experience)
   - [Admin Control & Moderation Suite](#3-admin-control--moderation-suite)
   - [Analytics & PDF Reporting Engine](#4-analytics--pdf-reporting-engine)
   - [Security & Session Integrity](#5-security--session-integrity)
4. [System Architecture & Data Flow](#-system-architecture--data-flow)
5. [Database Schema & Data Models](#-database-schema--data-models)
6. [Technology Stack](#-technology-stack)
7. [Installation & Setup](#-installation--setup)
8. [Configuration & Environment Variables](#-configuration--environment-variables)
9. [Complete API Endpoints Reference](#-complete-api-endpoints-reference)
10. [Test Suite Execution](#-test-suite-execution)
11. [Project Directory Layout](#-project-directory-layout)
12. [License](#-license)

---

## <img src="https://api.iconify.design/lucide:camera.svg?color=%233b82f6" width="22" height="22" style="vertical-align: middle;" /> Visual Showcase & Screenshots

>

| Preview Card | View Description |
| :--- | :--- |
| ![Hero Banner](docs/images/hero-banner.png) | **Platform Overview & Landing Banner** — Main branding and overview preview. |
| ![Player Lobby](docs/images/player-lobby.png) | **Player Dashboard & Lobby** — Lifetime records, win rate percentage, active streaks, and quick match launcher. |
| ![Live Gameplay](docs/images/gameplay-screen.png) | **Active Gameplay Arena** — 6-row animated tile grid, real-time letter validation, and synced virtual keyboard. |
| ![Game Over Modal](docs/images/game-summary-modal.png) | **Post-Game Summary Modal** — Victory/Defeat breakdown, target word reveal, time elapsed, and replay button. |
| ![Match History](docs/images/game-history.png) | **Match History & Records** — Paginated match table, status filters (`WON`, `LOST`, `EXPIRED`), and timeline inspection. |
| ![Admin Dashboard](docs/images/admin-dashboard.png) | **Admin Metrics Center** — Real-time active match counters, user counts, victory ratios, and visual charts. |
| ![User Management](docs/images/admin-user-management.png) | **User Moderation Portal** — User table, search filters, role switcher (`PLAYER` / `ADMIN`), and account status controls. |
| ![Word Management](docs/images/admin-word-management.png) | **Word Dictionary Manager** — Word inventory, status toggling (`Active` / `Inactive`), and dictionary creation modals. |
| ![Analytics & PDF Reports](docs/images/admin-reports-analytics.png) | **Analytics & PDF Exports** — Custom date ranges, interactive performance tables, and single-click PDF downloads. |
| ![System Settings](docs/images/admin-system-settings.png) | **System Configuration Panel** — Dynamic match timeouts, attempt rules, and security controls. |

---


## <img src="https://api.iconify.design/lucide:sparkles.svg?color=%23eab308" width="22" height="22" style="vertical-align: middle;" /> Deep-Dive Feature Breakdown

### 1. Gameplay Engine & Mechanics
- <img src="https://api.iconify.design/lucide:check-circle.svg?color=%2310b981" width="15" height="15" style="vertical-align: middle;" /> **Wordle Standard Evaluation Algorithm**:
  - **Green (Correct)**: Letter is in the word and in the exact correct position.
  - **Yellow (Present)**: Letter is in the word but in a different position (handles duplicate letters strictly without over-counting).
  - **Gray (Absent)**: Letter does not appear in the target word.
- <img src="https://api.iconify.design/lucide:hash.svg?color=%236366f1" width="15" height="15" style="vertical-align: middle;" /> **Configurable Attempt System**: Default of 6 attempts per game, dynamically adjustable via Admin Settings.
- <img src="https://api.iconify.design/lucide:shield-check.svg?color=%2310b981" width="15" height="15" style="vertical-align: middle;" /> **Server-Authoritative Validation**:
  - The client never receives the target word until the match reaches a terminal state (`WON`, `LOST`, `EXPIRED`).
  - Every guess is verified against the server dictionary before state transition.
  - Automatic letter normalization (case-insensitive, trimming).
- <img src="https://api.iconify.design/lucide:clock.svg?color=%23f59e0b" width="15" height="15" style="vertical-align: middle;" /> **Session Lifecycle & Stale Session Expiry**:
  - Matches track `started_at`, `completed_at`, and `last_activity_at`.
  - Inactive matches automatically transition to `EXPIRED` status after the configurable inactivity window (default: 15 minutes).

---

### 2. Player Portal & Experience
- <img src="https://api.iconify.design/lucide:user-check.svg?color=%233b82f6" width="15" height="15" style="vertical-align: middle;" /> **Secure Authentication & Session Recovery**:
  - JWT-based authentication with automatic token refresh handling.
  - Active game auto-recovery: If a player reloads or returns later, their in-progress board is restored.
- <img src="https://api.iconify.design/lucide:layout.svg?color=%238b5cf6" width="15" height="15" style="vertical-align: middle;" /> **Player Lobby & Lifetime Dashboard**:
  - Displays total games played, victory count, loss count, win percentage, and average attempts per win.
  - Current winning streak and best all-time streak counters.
- <img src="https://api.iconify.design/lucide:keyboard.svg?color=%2306b6d4" width="15" height="15" style="vertical-align: middle;" /> **Interactive Board & Dual Keyboard**:
  - Responsive letter grid with CSS flip transitions and shake animations on invalid submissions.
  - Synchronized on-screen virtual keyboard and physical keyboard listener (`A-Z`, `Enter`, `Backspace`).
  - Key tiles dynamically reflect the best discovered status (Green > Yellow > Gray).
- <img src="https://api.iconify.design/lucide:award.svg?color=%23eab308" width="15" height="15" style="vertical-align: middle;" /> **Post-Match Summary Dialog**:
  - Reveals victory or defeat status, target word, duration in seconds, and guess breakdown.
  - Immediate "Play Again" button that initiates a fresh match without leaving the view.
- <img src="https://api.iconify.design/lucide:history.svg?color=%2364748b" width="15" height="15" style="vertical-align: middle;" /> **Match History & Inspection**:
  - Paginated game log with status badge filters (`ALL`, `WON`, `LOST`, `EXPIRED`).
  - Expandable game cards displaying target word, date/time, total attempts used, and duration.

---

### 3. Admin Control & Moderation Suite
- <img src="https://api.iconify.design/lucide:bar-chart-3.svg?color=%233b82f6" width="15" height="15" style="vertical-align: middle;" /> **Executive Metrics Dashboard**:
  - KPI metric cards: Total Registered Users, Active Games, Today's Matches, Overall Win Rate, Total Guesses Submitted.
  - Outcome distribution breakdown (Won %, Lost %, Expired %, Active %).
  - Recent matches activity stream with quick links to match inspection.
- <img src="https://api.iconify.design/lucide:users.svg?color=%238b5cf6" width="15" height="15" style="vertical-align: middle;" /> **User Management & Moderation**:
  - Searchable, sortable user directory with pagination.
  - Status management: `Active`, `Inactive`, `Suspended`, `Deleted`.
  - Role management: Toggle between `PLAYER` and `ADMIN` with security safeguards (admins cannot demote themselves).
  - User profile inspector: View individual player lifetime stats, registration date, and last active timestamp.
- <img src="https://api.iconify.design/lucide:book-open.svg?color=%2310b981" width="15" height="15" style="vertical-align: middle;" /> **Word Dictionary Management**:
  - Add single words or manage the 5-letter dictionary inventory.
  - Toggle word status between `Active` (eligible for selection) and `Inactive`.
  - Delete or update existing words with instant cache invalidation.
- <img src="https://api.iconify.design/lucide:sliders.svg?color=%23f59e0b" width="15" height="15" style="vertical-align: middle;" /> **Dynamic System Settings**:
  - `MAX_ATTEMPTS`: Customize allowed guesses per match.
  - `SESSION_TIMEOUT_SECONDS`: Set match expiration thresholds.
  - `JWT_EXPIRY_MINUTES`: Control authentication session duration.

---

### 4. Analytics & PDF Reporting Engine
- <img src="https://api.iconify.design/lucide:calendar.svg?color=%233b82f6" width="15" height="15" style="vertical-align: middle;" /> **Daily Performance Aggregations**:
  - Query single-day reports or custom multi-day date ranges.
  - Metrics include: total games, victories, defeats, expired games, completed win rate, overall win rate, total guesses, and correct guesses.
  - Player participation breakdown and word difficulty analytics.
- <img src="https://api.iconify.design/lucide:user.svg?color=%238b5cf6" width="15" height="15" style="vertical-align: middle;" /> **Individual Player Dossier**:
  - Comprehensive performance audit by username or user ID.
  - Attempt distribution breakdown (wins on attempt 1, 2, 3, 4, 5, 6).
  - Chronological match history with duration, guess sequence, and outcome.
- <img src="https://api.iconify.design/lucide:file-text.svg?color=%23ef4444" width="15" height="15" style="vertical-align: middle;" /> **Server-Side PDF Generation (ReportLab & PyPDF2)**:
  - Pixel-perfect, production-grade PDF reports with corporate branding, headers, date stamps, and metadata tables.
  - Single-click download for both **Daily Summary PDF** and **Player Performance Dossier PDF**.

---

### 5. Security & Session Integrity
- <img src="https://api.iconify.design/lucide:lock.svg?color=%2310b981" width="15" height="15" style="vertical-align: middle;" /> **Cryptographic Password Hashing**: Utilizes **Argon2id** (`argon2-cffi`), the winner of the Password Hashing Competition.
- <img src="https://api.iconify.design/lucide:key.svg?color=%23f59e0b" width="15" height="15" style="vertical-align: middle;" /> **Stateless JWT Tokens**: Signed with HMAC-SHA256 containing user ID, role, and expiry timestamps.
- <img src="https://api.iconify.design/lucide:shield.svg?color=%23ef4444" width="15" height="15" style="vertical-align: middle;" /> **Anti-Tampering Route Guards**:
  - Players can only submit guesses to their own active match.
  - Submissions to completed, expired, or invalid matches are rejected with specific error codes.
  - Admin endpoints are protected by RBAC dependencies (`require_admin`).
- <img src="https://api.iconify.design/lucide:gauge.svg?color=%2306b6d4" width="15" height="15" style="vertical-align: middle;" /> **Rate Limiting & Protection**: SlowAPI middleware protects authentication and guess submission routes from brute-force attacks.

---

## <img src="https://api.iconify.design/lucide:workflow.svg?color=%236366f1" width="22" height="22" style="vertical-align: middle;" /> System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend (React 18 + Vite)"]
        UI["React UI (Bootstrap 5.3 + Lucide)"]
        Router["React Router v7 (RBAC Guards)"]
        AxiosClient["Axios Client (JWT Interceptor)"]
        UI --> Router --> AxiosClient
    end

    subgraph APILayer["⚡ API Gateway (FastAPI Async)"]
        AuthMiddleware["JWT Auth & Role Guard"]
        RateLimiter["SlowAPI Rate Limiter"]
        Routers["Endpoints (/auth, /game, /admin)"]
        AxiosClient -->|HTTPS + Bearer Token| AuthMiddleware
        AuthMiddleware --> RateLimiter --> Routers
    end

    subgraph ServiceLayer["⚙️ Business Logic & Services"]
        GameService["GameEngineService"]
        AdminService["AdminReportsService"]
        UserService["UserService"]
        PDFService["PDFReportService (ReportLab)"]
        Routers --> GameService
        Routers --> AdminService
        Routers --> UserService
        AdminService --> PDFService
    end

    subgraph DataLayer["🗄️ Persistence Layer"]
        Repo["SQLAlchemy 2.0 Async Repositories"]
        DB[("MySQL / SQLite Database")]
        GameService --> Repo
        AdminService --> Repo
        UserService --> Repo
        Repo -->|asyncmy / aiosqlite| DB
    end
```

---

## <img src="https://api.iconify.design/lucide:database.svg?color=%233b82f6" width="22" height="22" style="vertical-align: middle;" /> Database Schema & Data Models

```mermaid
erDiagram
    USERS ||--o{ GAME_SESSIONS : "plays"
    WORDS ||--o{ GAME_SESSIONS : "assigned_as_target"
    GAME_SESSIONS ||--o{ GUESSES : "contains"
    USERS ||--o{ USER_DAILY_SUMMARIES : "aggregates"

    USERS {
        int id PK
        string username UK
        string email UK
        string password_hash
        string role "PLAYER | ADMIN"
        boolean is_active
        boolean is_suspended
        boolean is_deleted
        datetime created_at
        datetime updated_at
    }

    WORDS {
        int id PK
        string word UK
        int length
        boolean is_active
        datetime created_at
    }

    GAME_SESSIONS {
        int id PK
        int user_id FK
        int word_id FK
        string status "ACTIVE | WON | LOST | EXPIRED"
        int attempts_used
        int max_attempts
        datetime started_at
        datetime completed_at
        datetime last_activity_at
    }

    GUESSES {
        int id PK
        int session_id FK
        string guess
        int attempt_number
        json result_evaluation
        datetime created_at
    }

    USER_DAILY_SUMMARIES {
        int id PK
        int user_id FK
        date summary_date
        int total_games
        int games_won
        int games_lost
        int games_expired
        int total_guesses
        int correct_guesses
    }
```

---

## <img src="https://api.iconify.design/lucide:cpu.svg?color=%2306b6d4" width="22" height="22" style="vertical-align: middle;" /> Technology Stack

### Backend Stack
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Python** | `3.12+` | Core programming runtime |
| **FastAPI** | `^0.115.0` | Asynchronous web framework & OpenAPI generation |
| **Uvicorn** | `^0.32.0` | High-performance ASGI production server |
| **SQLAlchemy** | `^2.0.36` | Asynchronous ORM and SQL toolkit |
| **asyncmy** | `^0.2.9` | Asynchronous MySQL database driver |
| **aiosqlite** | `^0.20.0` | Asynchronous SQLite driver for testing/development |
| **Pydantic** | `^2.9.0` | Data parsing, validation, and settings management |
| **Argon2-cffi** | `^23.1.0` | Password hashing algorithm |
| **PyJWT** | `^2.9.0` | JWT encoding, decoding, and verification |
| **ReportLab** | `^4.2.0` | Dynamic PDF rendering engine |
| **SlowAPI** | `^0.1.9` | Endpoint rate limiting middleware |
| **pytest** | `^8.2.0` | Unit and integration test runner |

### Frontend Stack
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^18.2.0` | Component-based UI library |
| **Vite** | `^5.0.8` | Next-generation frontend build tool |
| **React Router** | `^7.18.3` | Client-side routing with route guards |
| **Bootstrap** | `^5.3.8` | Responsive layout grid and component styling |
| **Bootstrap Icons** | `^1.13.1` | UI glyphs and iconography |
| **Lucide React** | `^1.48.0` | Modern vector icons |
| **React Toastify** | `^11.1.0` | Toast notifications for match and API feedback |

---

## <img src="https://api.iconify.design/lucide:terminal.svg?color=%2310b981" width="22" height="22" style="vertical-align: middle;" /> Installation & Setup

### Prerequisites
- **Python 3.12 or higher**
- **Node.js 18+ & npm**
- **MySQL 8.0+** (Optional: SQLite is supported out of the box for testing)

---

### Option 1: 1-Click Runner (Windows)

Double-click or run [`start.bat`](start.bat) from the repository root:

```cmd
.\start.bat
```

The script will:
1. Start the FastAPI backend server on `http://localhost:8000`
2. Start the Vite React development server on `http://localhost:5173`
3. Launch your default browser directly to the application

---

### Option 2: Manual Setup

#### Step 1: Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create Python virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 4. Install backend dependencies
pip install -r requirements.txt

# 5. Start the backend application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Step 2: Frontend Setup
```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend/word-guess-frontend

# 2. Install Node dependencies
npm install

# 3. Start Vite dev server
npm run dev
```

---

## <img src="https://api.iconify.design/lucide:settings.svg?color=%2364748b" width="22" height="22" style="vertical-align: middle;" /> Configuration & Environment Variables

Configure backend settings via an `.env` file located in the `backend/` root directory:

```env
# Database Connection (MySQL or SQLite)
DATABASE_URL=mysql+asyncmy://root:password@localhost:3306/word_guess_db

# Security & Authentication
SECRET_KEY=your_super_secret_jwt_hmac_signing_key_32_chars_min
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Game Rule Configuration
DEFAULT_MAX_ATTEMPTS=6
SESSION_INACTIVITY_TIMEOUT_SECONDS=900
ALLOWED_WORD_LENGTH=5

# CORS Settings
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

---

## <img src="https://api.iconify.design/lucide:book.svg?color=%233b82f6" width="22" height="22" style="vertical-align: middle;" /> Complete API Endpoints Reference

Explore interactive API documentation at:
- **Swagger UI**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **ReDoc**: [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)

### Authentication Endpoints
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new player account | No |
| `POST` | `/api/v1/auth/login` | Authenticate with credentials and receive JWT | No |
| `GET` | `/api/v1/auth/me` | Fetch current authenticated user profile | Yes (Bearer) |

### Player & Gameplay Endpoints
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/game/active` | Fetch active game state (or null if none) | Player / Admin |
| `POST` | `/api/v1/game/start` | Start a new match session | Player / Admin |
| `POST` | `/api/v1/game/guess` | Submit a 5-letter word guess | Player / Admin |
| `GET` | `/api/v1/game/history` | Paginated player match history | Player / Admin |
| `GET` | `/api/v1/game/{session_id}` | Retrieve specific match detail | Player / Admin |

### Admin & Moderation Endpoints
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | Aggregated platform metrics and KPIs | Admin Only |
| `GET` | `/api/v1/admin/users` | List, search, and paginate registered users | Admin Only |
| `PATCH` | `/api/v1/admin/users/{id}/role` | Update user role (`PLAYER` / `ADMIN`) | Admin Only |
| `PATCH` | `/api/v1/admin/users/{id}/status` | Update user status (`Active`, `Suspended`) | Admin Only |
| `GET` | `/api/v1/admin/words` | Word dictionary list with status filters | Admin Only |
| `POST` | `/api/v1/admin/words` | Add new word to dictionary | Admin Only |
| `DELETE` | `/api/v1/admin/words/{id}` | Remove word from dictionary | Admin Only |

### Analytics & PDF Reporting Endpoints
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/reports/daily` | Query aggregated daily report dataset | Admin Only |
| `GET` | `/api/v1/admin/reports/player/{id}` | Query detailed player performance dataset | Admin Only |
| `GET` | `/api/v1/admin/reports/export/daily.pdf` | Download daily summary report as PDF | Admin Only |
| `GET` | `/api/v1/admin/reports/export/player.pdf` | Download individual player dossier as PDF | Admin Only |

### System Settings Endpoints
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/settings` | Retrieve active system & security settings | Admin Only |
| `PUT` | `/api/v1/admin/settings` | Update match timeouts and attempt limits | Admin Only |

---

## <img src="https://api.iconify.design/lucide:flask-conical.svg?color=%23ef4444" width="22" height="22" style="vertical-align: middle;" /> Test Suite Execution

The repository includes a comprehensive `pytest` suite testing all core subsystems:

```bash
# Navigate to backend
cd backend

# Execute all test suites
pytest -v

# Run specific test modules
pytest tests/test_admin_reports.py -v
pytest tests/test_admin_users.py -v
pytest tests/test_admin_settings.py -v
pytest tests/test_match_security.py -v
```

---

## <img src="https://api.iconify.design/lucide:folder-tree.svg?color=%238b5cf6" width="22" height="22" style="vertical-align: middle;" /> Project Directory Layout

```
word-guessing/
├── docs/
│   └── images/                         # Screenshot gallery
├── backend/
│   ├── app/
│   │   ├── api/                        # FastAPI Route controllers
│   │   │   └── v1/                     # API Version 1 endpoints
│   │   ├── core/                       # App settings, security, exceptions
│   │   ├── db/                         # Database engine & async session factories
│   │   ├── dependencies/               # RBAC & authentication dependencies
│   │   ├── models/                     # SQLAlchemy ORM entity models
│   │   ├── repositories/               # Data access & database queries
│   │   ├── schemas/                    # Pydantic schemas & DTOs
│   │   ├── services/                   # Business logic, game engine & PDF service
│   │   └── utils/                      # Helper utilities
│   ├── tests/                          # Pytest integration & unit test suites
│   ├── requirements.txt                # Python backend dependencies
│   ├── pytest.ini                      # Pytest configuration
│   └── run.bat                         # Backend startup script
├── frontend/
│   └── word-guess-frontend/
│       ├── public/                     # Static web assets
│       ├── src/
│       │   ├── assets/                 # SVGs and styling assets
│       │   ├── components/             # Reusable UI components & modals
│       │   ├── context/                # React Context (AuthContext, GameContext)
│       │   ├── hooks/                  # Custom React hooks
│       │   ├── layouts/                # AdminLayout & PlayerLayout wrappers
│       │   ├── pages/
│       │   │   ├── admin/              # Admin dashboard, reports, settings, users, words
│       │   │   ├── auth/               # Login & Registration views
│       │   │   ├── errors/             # 404 and Error boundary views
│       │   │   └── player/             # Game arena, lobby, match history
│       │   ├── routes/                 # Protected routes & role-based route guards
│       │   ├── services/               # Axios API client modules
│       │   ├── utils/                  # Formatting and client helpers
│       │   ├── App.jsx                 # App root component
│       │   └── main.jsx                # React DOM entrypoint
│       └── package.json                # Frontend dependencies & scripts
├── start.bat                           # Root 1-click launch script
└── README.md                           # Main documentation
```

---

## <img src="https://api.iconify.design/lucide:file-badge.svg?color=%2310b981" width="22" height="22" style="vertical-align: middle;" /> License

This project is open source and available under the [MIT License](LICENSE).
