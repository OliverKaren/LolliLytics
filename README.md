# LoL Analytics — Intelligence Suite

> Draft Intelligence · Performance Benchmarking · Tilt Detection · Smurf Detection

A full-stack web application built with **React** (frontend) and **NestJS** (backend), backed by **PostgreSQL**.

---

## 🗂️ Project Structure

```
lol-analytics/
├── apps/
│   ├── backend/                  # NestJS API
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/             # JWT Authentication
│   │       │   ├── users/            # User management
│   │       │   ├── riot-api/         # Riot Games API client
│   │       │   ├── draft-intelligence/
│   │       │   ├── performance-benchmarking/
│   │       │   ├── tilt-detection/
│   │       │   └── smurf-detection/
│   │       ├── common/           # Guards, decorators, filters
│   │       ├── config/           # App + DB configuration
│   │       └── database/         # Entities, migrations
│   └── frontend/                 # React + Vite + TailwindCSS
│       └── src/
│           ├── components/       # Shared UI components
│           ├── pages/            # One page per module
│           ├── services/api/     # Axios + all API calls
│           ├── store/            # Zustand global state
│           ├── hooks/            # React Query hooks
│           └── types/            # Shared TypeScript types
├── docker-compose.yml            # PostgreSQL + Redis + pgAdmin
└── .env.example
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js ≥ 18
- Docker & Docker Compose
- A [Riot Games API key](https://developer.riotgames.com/)

### 2. Clone & Install

```bash
git clone <your-repo>
cd lol-analytics

cp .env.example .env
# → Edit .env and add your RIOT_API_KEY and JWT_SECRET

npm install
```

### 3. Start the Database

```bash
npm run docker:up
# PostgreSQL → localhost:5432
# pgAdmin    → http://localhost:5050  (admin@lol-analytics.local / admin)
# Redis      → localhost:6379
```

### 4. Start Development Servers

```bash
npm run dev
# Backend  → http://localhost:3001
# Frontend → http://localhost:5173
# Swagger  → http://localhost:3001/api/docs
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|---|---|
| `RIOT_API_KEY` | Your Riot Games API key |
| `JWT_SECRET` | Secret for signing JWTs |
| `DB_*` | PostgreSQL connection |
| `REDIS_*` | Redis connection |

---

## 📦 Tech Stack

### Backend
- **NestJS** — Modular Node.js framework
- **TypeORM** — Database ORM
- **PostgreSQL** — Primary database
- **Redis** — Caching (response time, Riot API rate limits)
- **Passport.js + JWT** — Authentication
- **Swagger** — Auto-generated API docs

### Frontend
- **React 18** — UI
- **Vite** — Build tool
- **TailwindCSS** — Styling
- **React Query** — Server state management
- **Zustand** — Client state management
- **Recharts** — Data visualisation
- **React Router v6** — Routing

---

## 🧠 Feature Modules

### 1. Draft Intelligence (`/draft`)
- Champion winrate by Patch / 30 days / Season
- Matchup difficulty rating (Easy / Medium / Hard)
- Team composition synergy score
- Comfort & Risk Pick detection
- Draft hints: High Confidence / Risky / Counter Risk

### 2. Performance Benchmarking (`/performance`)
- Compare stats vs Master / GM / Challenger averages
- Percentile rankings (KDA, CS, Damage, Vision)
- Lane Phase Score and Objective Impact score
- Automatic strength and weakness detection

### 3. Tilt & Consistency Detection (`/tilt`)
- Loss streak detection with performance drop analysis
- Session fatigue detection (same-day performance decay)
- Time-of-day win rate analysis
- Consistency Score + Tilt Risk Indicator
- Break and champion/role stability recommendations

### 4. Smurf / Hidden MMR Detection (`/smurf`)
- Rank progression outlier detection
- Win rate vs rank average comparison
- Mechanical outlier stats (KDA, CS/min)
- Smurf Probability Score with confidence level
- Signal-by-signal breakdown

---

## 🗄️ Database Migrations

```bash
# Generate a new migration
npm run migration:generate -- --name=YourMigrationName

# Run pending migrations
npm run db:migrate

# Revert last migration
cd apps/backend && npm run migration:revert
```

---

## 📖 API Documentation

Swagger UI is available at `http://localhost:3001/api/docs` in development.

Key endpoints:
- `POST /api/v1/auth/register` — Create account
- `POST /api/v1/auth/login` — Get JWT
- `POST /api/v1/draft-intelligence/analyze-draft` — Full draft analysis
- `GET /api/v1/performance/report/:puuid` — Performance report
- `GET /api/v1/tilt-detection/report/:puuid` — Tilt report
- `GET /api/v1/smurf-detection/report/:puuid` — Smurf report

---

## 🔮 Next Steps (TODO)

- [ ] Implement match import / sync job (fetch + store matches from Riot API)
- [ ] Implement real ChampionStats aggregation pipeline
- [ ] Add patch timeline data from community datasets (CommunityDragon / DDragon)
- [ ] Add real percentile distribution data for benchmarking
- [ ] Implement WebSocket for live draft mode
- [ ] Add player search by Riot ID (gameName#tagLine)
- [ ] Role detection and champion pool management
- [ ] Export reports as PDF

---

## 🛡️ Notes

This app uses the **Riot Games API** under their [Developer Terms](https://developer.riotgames.com/terms). 
Riot production API keys require approval for public/commercial use.
