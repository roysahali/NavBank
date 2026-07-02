# Project Brain

This file is read by every agent at the start of every session.

## Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS         |
| Backend  | Python 3.12 + FastAPI + SQLAlchemy + SQLite         |
| Auth     | JWT (python-jose) + bcrypt (passlib)                |
| Testing  | Vitest (FE) · pytest (BE)                           |
| Linting  | ESLint (FE) · Ruff + mypy (BE)                     |
| CI/CD    | GitHub Actions (ci/github-actions.yml)              |

## Project: NovBank — Banking Application

### User Roles
- **customer** — regular account holder (register at `/register`, dashboard at `/dashboard`)
- **admin** — bank manager (created via `seed.py`, portal at `/admin`)

### Key Business Rules
- Every registered customer auto-gets one savings account
- Account numbers: `ACC` + 10 random digits
- Transfers require both accounts to be `active`
- Admin can freeze/unfreeze accounts and make deposits to any account
- Admins cannot disable other admin accounts

## Project Layout

```
.
├── frontend/              React + Vite app (port 3000)
│   └── src/
│       ├── api/           HTTP client + per-resource API modules
│       ├── contexts/      AuthContext (JWT + user state)
│       ├── components/    CustomerLayout, AdminLayout, PrivateRoute
│       ├── pages/
│       │   ├── Login.tsx, Register.tsx
│       │   ├── customer/  Dashboard, Transactions, Transfer
│       │   └── admin/     Dashboard, Users, Accounts, Transactions
│       └── types/         Shared TypeScript types
├── backend/               FastAPI app (port 8000)
│   ├── app/
│   │   ├── api/routes/    auth, accounts, transactions, admin, health
│   │   ├── core/          config, security (JWT/bcrypt), deps (auth guards)
│   │   ├── models/        User, Account, Transaction (SQLAlchemy)
│   │   ├── schemas/       Pydantic request/response schemas
│   │   └── services/      (reserved for business logic)
│   ├── seed.py            Populates DB with demo users + transactions
│   └── tests/
├── .claude/               Agents + commands (starter kit)
├── .agents/               Skills (starter kit)
└── ci/                    Pipeline configs
```

## Dev Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm test
npm run lint
npm run type-check
```

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
python seed.py           # Populate demo data (run once)
uvicorn app.main:app --reload   # http://localhost:8000
pytest tests/unit/
ruff check .
mypy app/
```

## API Contract

- All routes prefixed with `/api`
- Frontend dev server proxies `/api` → `http://localhost:8000`
- API docs: http://localhost:8000/api/docs
- Health: GET /api/health
- Auth: POST /api/auth/login · /api/auth/register · GET /api/auth/me
- Customer: GET /api/accounts · /api/transactions · POST /api/transactions/transfer|deposit|withdraw
- Admin: GET /api/admin/stats|users|accounts|transactions · POST /api/admin/accounts|deposit · PATCH /api/admin/accounts/{id}/freeze|unfreeze

## Demo Credentials (after running seed.py)

| Role     | Email                  | Password   |
|----------|------------------------|------------|
| Admin    | admin@novbank.com      | Admin@123  |
| Customer | alice@example.com      | Alice@123  |
| Customer | bob@example.com        | Bob@123    |

## Quality Rules

- No PR without passing: `/run-tests` → `/quality-gate` → `/security-scan`
- Frontend tests in `src/test/`; never modify expected results — fix source
- Backend tests in `tests/`; integration tests hit real services, no mocks
- WCAG 2.2 AA accessibility required for all UI

## Git Conventions

- Branch per developer, never share branches
- Pull before starting every session
- Commit messages: imperative mood, present tense
- Gate results must be green before `/create-pr`

## Environment

Copy `backend/.env.example` → `backend/.env` before starting.
