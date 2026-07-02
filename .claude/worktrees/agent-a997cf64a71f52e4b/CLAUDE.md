# Project Brain

This file is read by every agent at the start of every session.

## Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + TypeScript + Vite      |
| Backend  | Python 3.12 + FastAPI + Pydantic  |
| Testing  | Vitest (FE) · pytest (BE)         |
| Linting  | ESLint (FE) · Ruff + mypy (BE)   |
| CI/CD    | GitHub Actions (ci/github-actions.yml) |

## Project Layout

```
.
├── frontend/          React + Vite app (port 3000)
│   ├── src/
│   │   ├── api/       HTTP client (fetch wrapper)
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   └── ...
├── backend/           FastAPI app (port 8000)
│   ├── app/
│   │   ├── api/routes/  Route handlers
│   │   ├── core/        Config, settings
│   │   ├── models/      Pydantic models
│   │   └── services/    Business logic
│   └── tests/
│       ├── unit/
│       └── integration/
├── .claude/           Agents + commands (starter kit)
├── .agents/           Skills (starter kit)
└── ci/                Pipeline configs
```

## Dev Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm test             # Vitest unit tests
npm run lint
npm run type-check
```

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload   # http://localhost:8000
pytest tests/unit/              # Unit tests
pytest tests/integration/       # Integration tests
ruff check .
mypy src/
```

## API Contract

- All backend routes are prefixed with `/api`
- Frontend dev server proxies `/api` → `http://localhost:8000`
- API docs: http://localhost:8000/api/docs
- Health check: GET /api/health

## Quality Rules

- No PR without passing: `/run-tests` → `/quality-gate` → `/security-scan`
- Frontend tests live in `src/test/`; never modify expected results — fix source
- Backend tests live in `tests/`; integration tests hit real services, no mocks
- WCAG 2.2 AA accessibility required for all UI — run `/nfr-test` before shipping

## Git Conventions

- Branch per developer, never share branches
- Pull before starting every session
- Commit messages: imperative mood, present tense
- Gate results must be green before `/create-pr`

## Environment

Copy `backend/.env.example` → `backend/.env` and fill in values before starting.
