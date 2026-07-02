# NovBank — Technical Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Layout](#3-repository-layout)
4. [Backend Architecture](#4-backend-architecture)
   - 4.1 [Entry Point & Application Bootstrap](#41-entry-point--application-bootstrap)
   - 4.2 [Configuration](#42-configuration)
   - 4.3 [Database Layer](#43-database-layer)
   - 4.4 [Data Models](#44-data-models)
   - 4.5 [Schemas (Pydantic)](#45-schemas-pydantic)
   - 4.6 [Authentication & Security](#46-authentication--security)
   - 4.7 [Route Structure](#47-route-structure)
   - 4.8 [Services Layer](#48-services-layer)
5. [Frontend Architecture](#5-frontend-architecture)
   - 5.1 [Entry Point & Routing](#51-entry-point--routing)
   - 5.2 [Authentication Context](#52-authentication-context)
   - 5.3 [API Client](#53-api-client)
   - 5.4 [Component Hierarchy](#54-component-hierarchy)
   - 5.5 [Pages](#55-pages)
6. [Feature Walkthroughs](#6-feature-walkthroughs)
   - 6.1 [Registration & Login](#61-registration--login)
   - 6.2 [OTP Login](#62-otp-login)
   - 6.3 [Dashboard](#63-dashboard)
   - 6.4 [Accounts](#64-accounts)
   - 6.5 [Transfers (NEFT / RTGS / IMPS)](#65-transfers-neft--rtgs--imps)
   - 6.6 [UPI Payments](#66-upi-payments)
   - 6.7 [Credit Cards](#67-credit-cards)
   - 6.8 [Loans & EMI](#68-loans--emi)
   - 6.9 [Transaction History & Reports](#69-transaction-history--reports)
   - 6.10 [Notifications](#610-notifications)
   - 6.11 [Customer Support Tickets](#611-customer-support-tickets)
   - 6.12 [Nova AI Chatbot](#612-nova-ai-chatbot)
   - 6.13 [Admin Panel](#613-admin-panel)
7. [API Reference](#7-api-reference)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Security Model](#9-security-model)
10. [Development Setup](#10-development-setup)

---

## 1. Project Overview

**NovBank** is a full-stack internet banking simulation built as a learning and demonstration platform. It supports two user roles:

| Role | Entry point | What they can do |
|---|---|---|
| **Customer** | `/register` or `/login` | View accounts, make transfers, pay bills, manage loans, chat with AI |
| **Admin** | Created via `seed.py` | Manage all users/accounts, make deposits, handle support tickets |

Every registered customer automatically receives one savings account. The system includes real-time notifications, a customer support ticket system with threaded replies, CSV report exports, and an AI chatbot (Nova) powered by Anthropic Claude.

---

## 2. Technology Stack

### Backend

| Component | Technology | Version |
|---|---|---|
| Web framework | FastAPI | 0.115.0 |
| ASGI server | Uvicorn | 0.30.6 |
| ORM | SQLAlchemy | 2.0.35 |
| Database | SQLite | (file: `banking.db`) |
| Data validation | Pydantic v2 | 2.9.2 |
| Settings | pydantic-settings | 2.5.2 |
| Auth tokens | python-jose (HS256 JWT) | 3.3.0 |
| Password hashing | passlib + bcrypt | 1.7.4 + 4.2.1 |
| AI | Anthropic SDK | ≥ 0.50.0 |
| Language | Python | 3.12 |

> **bcrypt version note:** passlib 1.7.4 is incompatible with bcrypt 5.x. The project pins `bcrypt==4.2.1`. The warning `(trapped) error reading bcrypt version` is harmless and can be ignored.

### Frontend

| Component | Technology | Version |
|---|---|---|
| UI library | React | 18.3 |
| Language | TypeScript | 5.5 |
| Build tool | Vite | 5.4 |
| Styling | Tailwind CSS | 3.4 |
| Routing | React Router DOM | 6.26 |
| Animations | Framer Motion | 11.3 |
| Charts | Recharts | 2.12 |
| Icons | Lucide React | 0.441 |
| Toasts | react-hot-toast | 2.4 |
| Testing | Vitest + Testing Library | 2.0 |

---

## 3. Repository Layout

```
new_project/
├── backend/
│   ├── app/
│   │   ├── main.py              ← FastAPI app, router registration, CORS
│   │   ├── database.py          ← SQLAlchemy engine + session factory
│   │   ├── core/
│   │   │   ├── config.py        ← Pydantic Settings (reads .env)
│   │   │   ├── security.py      ← JWT creation/decode, bcrypt helpers
│   │   │   └── deps.py          ← FastAPI dependency injectors (auth guards)
│   │   ├── models/              ← SQLAlchemy ORM models (one per entity)
│   │   │   ├── user.py
│   │   │   ├── account.py
│   │   │   ├── transaction.py
│   │   │   ├── beneficiary.py
│   │   │   ├── upi.py
│   │   │   ├── credit_card.py
│   │   │   ├── loan.py
│   │   │   ├── otp.py
│   │   │   ├── notification.py
│   │   │   ├── support.py
│   │   │   └── chat.py
│   │   ├── schemas/             ← Pydantic request/response schemas
│   │   │   └── (mirrors models/)
│   │   ├── api/
│   │   │   └── routes/          ← One router per domain
│   │   │       ├── auth.py
│   │   │       ├── accounts.py
│   │   │       ├── transactions.py
│   │   │       ├── beneficiaries.py
│   │   │       ├── upi.py
│   │   │       ├── credit_cards.py
│   │   │       ├── loans.py
│   │   │       ├── dashboard.py
│   │   │       ├── reports.py
│   │   │       ├── notifications.py
│   │   │       ├── support.py
│   │   │       ├── chat.py
│   │   │       ├── admin.py
│   │   │       └── health.py
│   │   └── services/
│   │       ├── ai_chat.py       ← Nova AI logic (Claude API + rule-based fallback)
│   │       └── notifications.py ← notify() helper used by all payment routes
│   ├── seed.py                  ← Populates demo users, accounts, transactions
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx             ← React DOM render, BrowserRouter
│   │   ├── App.tsx              ← All route definitions
│   │   ├── api/                 ← Per-domain API modules (all use api client)
│   │   │   ├── client.ts        ← fetch wrapper with JWT injection + 401 handler
│   │   │   ├── auth.ts
│   │   │   ├── accounts.ts
│   │   │   ├── transactions.ts
│   │   │   ├── beneficiaries.ts
│   │   │   ├── upi.ts
│   │   │   ├── creditCards.ts
│   │   │   ├── loans.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── reports.ts
│   │   │   ├── notifications.ts
│   │   │   ├── support.ts
│   │   │   ├── chat.ts
│   │   │   └── admin.ts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  ← Global user + token state
│   │   ├── components/
│   │   │   ├── PrivateRoute.tsx ← Route guard by role
│   │   │   ├── layout/
│   │   │   │   ├── BankingLayout.tsx  ← Shell: sidebar + toaster + ChatWidget
│   │   │   │   └── Sidebar.tsx        ← Nav links, unread badge, logout
│   │   │   ├── chat/
│   │   │   │   └── ChatWidget.tsx     ← Floating chat bubble (all pages)
│   │   │   ├── cards/
│   │   │   │   └── CreditCardDisplay.tsx
│   │   │   └── ui/
│   │   │       ├── Modal.tsx
│   │   │       ├── Skeleton.tsx
│   │   │       └── ScrollReveal.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx / Register.tsx
│   │   │   ├── customer/        ← Dashboard, Accounts, Transactions, Transfer,
│   │   │   │                       UPI, CreditCards, Loans, Reports,
│   │   │   │                       Notifications, Support, Chat
│   │   │   └── admin/           ← Dashboard, Users, Accounts, Transactions, Support
│   │   ├── types/index.ts       ← Shared TypeScript interfaces
│   │   └── utils/formatters.ts  ← INR formatting, date helpers
│   ├── package.json
│   └── vite.config.ts
├── CLAUDE.md                    ← Project brief (read by AI agents)
└── DOCUMENTATION.md             ← This file
```

---

## 4. Backend Architecture

### 4.1 Entry Point & Application Bootstrap

**`backend/app/main.py`**

FastAPI is instantiated with a `lifespan` async context manager. On startup it calls `Base.metadata.create_all(bind=engine)`, which creates all database tables if they don't exist yet. This means the app is self-initialising — no manual migration step is needed for a fresh install.

All SQLAlchemy models are imported at the top of `main.py` with `# noqa: F401` comments. This is deliberate: SQLAlchemy's `create_all` only knows about models that have been imported into the Python process. Without these imports, tables would not be created.

```python
# Register ALL models before create_all
import app.models.user        # noqa: F401
import app.models.account     # noqa: F401
...
import app.models.chat        # noqa: F401
```

CORS is configured to allow requests from `http://localhost:3000` (the Vite dev server). Every router is mounted under the `/api` prefix.

### 4.2 Configuration

**`backend/app/core/config.py`**

Settings are managed by `pydantic-settings`. The `Settings` class reads values from `backend/.env` at startup and falls back to the defaults shown below:

| Key | Default | Purpose |
|---|---|---|
| `database_url` | `sqlite:///./banking.db` | SQLite file path |
| `secret_key` | (hardcoded dev value) | JWT signing key — change in production |
| `algorithm` | `HS256` | JWT algorithm |
| `access_token_expire_minutes` | `1440` (24 h) | Token lifetime |
| `demo_otp` | `123456` | Fixed OTP accepted in all OTP flows |
| `otp_expire_minutes` | `5` | OTP session validity |
| `anthropic_api_key` | `""` (empty) | Claude API key — if empty, rule-based fallback is used |
| `ai_model` | `claude-haiku-4-5-20251001` | Claude model for Nova chatbot |

### 4.3 Database Layer

**`backend/app/database.py`**

SQLite is used with `check_same_thread=False` to allow FastAPI's async request handling to share a synchronous SQLAlchemy session. The `get_db` function is a FastAPI dependency that yields a session and closes it after the request completes (even on error):

```
Request arrives
  → FastAPI injects get_db()
      → SessionLocal() opened
          → route handler runs (uses db)
      → db.close() called (finally block)
```

All models inherit from `Base = DeclarativeBase()`. The `engine` is created once at import time and reused across all requests.

### 4.4 Data Models

Each model file corresponds to one or more database tables. All model files use `from __future__ import annotations` (required for SQLAlchemy 2.0 `Mapped[]` type syntax under Python 3.9).

#### User

```
users
├── id (PK)
├── email (unique)
├── full_name
├── hashed_password
├── role                 "customer" | "admin"
├── mobile (unique)
├── pan_number
├── kyc_status           "verified" | "pending" | "rejected"
├── address
├── is_active
└── created_at
```

Relationships (all `cascade="all, delete-orphan"`):
- `accounts` → Account
- `beneficiaries` → Beneficiary
- `upi_vpas` → UpiVpa
- `credit_cards` → CreditCard
- `loans` → Loan
- `notifications` → Notification
- `support_tickets` → SupportTicket
- `chat_sessions` → ChatSession

The cascade configuration means deleting a user automatically deletes everything linked to them.

#### Account

```
accounts
├── id (PK)
├── account_number        "ACC" + 10 digits (generated on insert)
├── user_id (FK → users)
├── account_type         "savings" | "current"
├── balance              Float
├── status               "active" | "frozen" | "closed"
├── ifsc_code            "NOVB0001001"
├── branch_name
├── interest_rate        3.5 (default)
├── nominee_name
└── created_at
```

#### Transaction

```
transactions
├── id (PK)
├── from_account_id (FK → accounts, nullable)   ← null for deposits
├── to_account_id   (FK → accounts, nullable)   ← null for withdrawals
├── amount
├── transaction_type    "deposit" | "withdrawal" | "transfer"
├── transfer_mode       "NEFT" | "RTGS" | "IMPS" | "UPI" | "INTERNAL" | "ATM"
├── reference_number
├── category            "food" | "utilities" | "rent" | ... | "transfer" | "other"
├── beneficiary_name
├── beneficiary_account
├── ifsc_code
├── status              "completed" | "failed"
├── description
└── created_at
```

#### Loan + EmiPayment

```
loans
├── id, user_id (FK), loan_type ("home"|"personal"|"auto")
├── loan_number (unique), principal_amount, outstanding_amount
├── interest_rate, tenure_months, emi_amount
├── disbursed_date, next_due_date, status ("active"|"closed"|"overdue")
├── purpose, linked_account_id (FK → accounts)
└── created_at

emi_payments
├── id, loan_id (FK), installment_number
├── amount_paid, payment_date, status ("paid"|"overdue")
└── created_at
```

#### CreditCard + CreditCardTransaction

```
credit_cards
├── id, user_id (FK), card_number (masked, unique)
├── card_type ("VISA"|"MASTERCARD"|"RUPAY"), card_variant ("Platinum"|"Gold"|"Classic")
├── credit_limit, outstanding_amount, available_limit
├── billing_date (day of month), due_date_day, minimum_due
├── reward_points, status ("active"|"blocked"|"expired")
├── expiry_month, expiry_year
└── created_at

cc_transactions
├── id, card_id (FK), amount, merchant_name
├── category, transaction_type ("purchase"|"payment"|"refund"|"cashback")
├── status ("posted"|"pending")
└── created_at
```

#### UpiVpa + UpiTransaction

```
upi_vpas
├── id, user_id (FK), vpa (e.g. "alice@novbank")
├── linked_account_id (FK → accounts)
├── is_primary, is_active
└── created_at

upi_transactions
├── id, sender_vpa, receiver_vpa, amount, note
├── upi_reference, status ("success"|"failed")
├── transaction_id (FK → transactions)
└── created_at
```

#### Notification

```
notifications
├── id, user_id (FK)
├── title, message (Text)
├── type    "info" | "success" | "warning" | "alert"
├── is_read (Boolean, default False)
├── related_url (nullable)
└── created_at
```

#### SupportTicket + SupportMessage

```
support_tickets
├── id, user_id (FK), ticket_number (unique, e.g. "TKT-000042")
├── subject, category ("account"|"card"|"loan"|"upi"|"transfer"|"other")
├── priority ("low"|"medium"|"high")
├── status ("open"|"in_progress"|"resolved"|"closed")
└── created_at, updated_at

support_messages
├── id, ticket_id (FK), sender_id (FK → users)
├── message (Text), is_admin_reply (Boolean)
└── created_at
```

#### ChatSession + ChatMessage

```
chat_sessions
├── id, user_id (FK)
├── title (auto-set from first user message, max 60 chars)
└── created_at, updated_at

chat_messages
├── id, session_id (FK)
├── role    "user" | "assistant"
├── content (Text)
└── created_at
```

#### OtpSession

```
otp_sessions
├── id, mobile, otp_code
├── purpose ("login")
├── is_used (Boolean)
├── expires_at
└── created_at
```

### 4.5 Schemas (Pydantic)

Each domain has a corresponding file in `backend/app/schemas/`. Schemas serve three purposes:

1. **Request bodies** — validated on incoming POST/PATCH requests
2. **Response models** — serialise ORM objects to JSON
3. **Admin-specific variants** — e.g., `AdminCreateUser`, `AdminUpdateUser`

All response schemas that read from ORM objects use:
```python
model_config = {"from_attributes": True}
```
This is the Pydantic v2 equivalent of `orm_mode = True`.

### 4.6 Authentication & Security

**`backend/app/core/security.py`**

| Function | What it does |
|---|---|
| `hash_password(password)` | bcrypt-hashes a plain-text password |
| `verify_password(plain, hashed)` | constant-time bcrypt comparison |
| `create_access_token(data)` | encodes `{"sub": user_id, "role": role, "exp": ...}` as HS256 JWT |
| `decode_token(token)` | decodes and verifies the JWT, raises `JWTError` if invalid |
| `generate_otp()` | returns a 6-digit random string |

**`backend/app/core/deps.py`**

FastAPI dependency functions injected into route handlers:

```
get_current_user(token, db)
  → decodes JWT
  → loads User from DB
  → raises 401 if invalid/expired or user inactive
  → returns User object

get_current_admin(current_user)
  → wraps get_current_user
  → raises 403 if role != "admin"
```

`OAuth2PasswordBearer` reads the `Authorization: Bearer <token>` header. For CSV downloads (which browsers initiate as plain navigations, not XHR), a custom `get_csv_user` dependency additionally accepts the token from a `?token=` query parameter.

**Token lifecycle:**
1. Client receives JWT on login or register
2. Stored in `localStorage` on the frontend
3. Attached as `Authorization: Bearer <token>` on every API request
4. Expires after 24 hours (configurable)
5. On 401 response, the frontend clears localStorage and redirects to `/login`

### 4.7 Route Structure

All routes are registered with prefix `/api`. The full path pattern is:

```
/api/<router-prefix>/<path>
```

| Router | Prefix | Key endpoints |
|---|---|---|
| health | `/health` | `GET /` |
| auth | `/auth` | `POST /register`, `POST /login`, `GET /me`, `POST /otp/send`, `POST /otp/verify` |
| accounts | `/accounts` | `GET /`, `GET /{id}` |
| transactions | `/transactions` | `GET /`, `POST /transfer`, `POST /deposit`, `POST /withdraw` |
| beneficiaries | `/beneficiaries` | CRUD |
| upi | `/upi` | `GET /vpas`, `POST /vpas`, `DELETE /vpas/{id}`, `POST /pay`, `GET /transactions`, `GET /resolve/{vpa}` |
| credit_cards | `/credit-cards` | `GET /`, `GET /{id}`, `GET /{id}/transactions`, `POST /{id}/pay-bill` |
| loans | `/loans` | `GET /`, `GET /{id}`, `GET /{id}/schedule`, `POST /{id}/pay-emi` |
| dashboard | `/dashboard` | `GET /summary`, `GET /spending`, `GET /monthly-flow`, `GET /insights` |
| reports | `/reports` | `GET /transactions/csv` |
| notifications | `/notifications` | `GET /`, `GET /unread-count`, `PATCH /{id}/read`, `PATCH /read-all`, `DELETE /{id}` |
| support | `/support` | Customer CRUD + Admin routes under `/support/admin/tickets` |
| chat | `/chat` | `POST /sessions`, `GET /sessions`, `GET /sessions/{id}`, `POST /sessions/{id}/message`, `DELETE /sessions/{id}` |
| admin | `/admin` | Stats, user CRUD, account management, deposits |

**Important FastAPI convention used throughout:** routes are registered as `@router.get("")` (empty string), not `@router.get("/")`. FastAPI with trailing-slash routes returns a 307 redirect when the client omits the trailing slash. Using `""` avoids this entirely.

### 4.8 Services Layer

**`backend/app/services/notifications.py`**

A single `notify()` helper function called from any route that completes a financial transaction:

```python
def notify(db, user_id, title, message, type="info", related_url=None):
    db.add(Notification(user_id=user_id, title=title, message=message,
                        type=type, related_url=related_url))
    # Does NOT commit — the calling route's db.commit() picks it up
```

This is intentionally lightweight. The notification is added to the same database session as the transaction it accompanies, so both are committed atomically. If the transaction fails and rolls back, the notification is never written.

Notifications fire on:
- **Transfer sent** — debit alert to sender
- **Transfer received** — credit alert to receiver (same NovBank DB)
- **Self deposit** — credit alert
- **Withdrawal** — debit alert
- **UPI payment sent** — debit alert to sender
- **UPI payment received** — credit alert to receiver
- **Credit card bill paid** — success notification
- **EMI paid** — success notification (or "Loan Closed" if fully repaid)
- **Admin deposit** — credit alert to account owner

**`backend/app/services/ai_chat.py`**

The Nova AI service. See section 6.12 for a full walkthrough.

---

## 5. Frontend Architecture

### 5.1 Entry Point & Routing

**`frontend/src/main.tsx`** renders `<BrowserRouter><App /></BrowserRouter>` into the DOM.

**`frontend/src/App.tsx`** wraps everything in `<AuthProvider>` (so all pages have access to auth state) and defines all routes using React Router v6:

```
/login                → Login page (public)
/register             → Register page (public)
/dashboard            → PrivateRoute(role="customer") → CustomerDashboard
/accounts             → PrivateRoute(role="customer") → CustomerAccounts
...
/chat                 → PrivateRoute(role="customer") → CustomerChat
/admin                → PrivateRoute(role="admin")    → AdminDashboard
/admin/users          → PrivateRoute(role="admin")    → AdminUsers
...
/                     → Navigate to /login
*                     → Navigate to /login
```

`PrivateRoute` checks `user` from `AuthContext`. If not logged in, it redirects to `/login`. If the role doesn't match (e.g., a customer tries `/admin`), it redirects to the appropriate home page.

### 5.2 Authentication Context

**`frontend/src/contexts/AuthContext.tsx`**

A React Context that provides global auth state to all components:

```typescript
interface AuthContextValue {
  user: User | null       // Currently logged-in user object
  token: string | null    // JWT string
  login(token, user)      // Called after successful login/register: saves to localStorage
  logout()                // Clears localStorage, resets state
  isLoading: boolean      // True during initial localStorage hydration
}
```

On first render, the context reads `token` and `user` from `localStorage` to rehydrate state (so the user stays logged in across page refreshes). `isLoading` prevents `PrivateRoute` from redirecting to `/login` before this hydration completes.

### 5.3 API Client

**`frontend/src/api/client.ts`**

A thin `fetch` wrapper that handles:
- Injecting the `Authorization: Bearer <token>` header on every request
- Parsing JSON responses
- On HTTP 401: clears auth state from localStorage and redirects to `/login`
- Throwing an `Error` with the API's `detail` message for all non-2xx responses

```typescript
export const api = {
  get:    <T>(path) => request<T>(path),
  post:   <T>(path, body?) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch:  <T>(path, body?) => request<T>(path, { method: 'PATCH', ... }),
  delete: <T>(path) => request<T>(path, { method: 'DELETE' }),
  put:    <T>(path, body?) => request<T>(path, { method: 'PUT', ... }),
}
```

During development, Vite proxies all `/api` requests to `http://localhost:8000`, so the frontend code never needs to specify a host.

Each domain has its own API module (e.g., `api/transactions.ts`, `api/loans.ts`) that imports `api` from `client.ts` and exports typed functions. This keeps the rest of the codebase free from raw fetch calls.

### 5.4 Component Hierarchy

```
App
└── AuthProvider
    ├── PrivateRoute
    │   └── BankingLayout          ← All authenticated customer pages
    │       ├── Sidebar            ← Navigation + unread badge + logout
    │       ├── <page content>     ← Injected via children prop
    │       ├── ChatWidget         ← Floating bubble (customers only)
    │       └── Toaster            ← Global toast notifications
    └── PrivateRoute
        └── BankingLayout(isAdmin) ← All admin pages
            ├── Sidebar(isAdmin)
            └── <admin page>
```

**BankingLayout** is the master shell. It renders `Sidebar`, the page content, the `ChatWidget`, and the `Toaster`. Admin pages also use `BankingLayout` but pass `isAdmin={true}` to switch the sidebar to the admin nav.

**Sidebar** polls `GET /notifications/unread-count` every 60 seconds and displays a red badge on the Notifications nav item. The polling stops if `isAdmin` is true (admins don't have personal notifications).

### 5.5 Pages

#### Customer pages

| Route | Page | What it does |
|---|---|---|
| `/dashboard` | Dashboard | Summary cards, monthly flow chart (Recharts), spending breakdown, AI insights |
| `/accounts` | Accounts | Account cards with balance, freeze status, IFSC; quick deposit/withdraw modals |
| `/transactions` | Transactions | Filterable, paginated transaction list (date range, type, mode, account) |
| `/transfer` | Transfer | Multi-tab form for NEFT/RTGS/IMPS; beneficiary selector |
| `/upi` | UPI | VPA management, send money flow, UPI transaction history |
| `/credit-cards` | CreditCards | Card display, transaction list, pay-bill modal |
| `/loans` | Loans | Loan overview, EMI schedule table, pay-EMI modal |
| `/reports` | Reports | Date-range filter, CSV download (token injected into URL query string) |
| `/notifications` | Notifications | All/Unread tabs, click-to-mark-read, hover-delete |
| `/support` | Support | Ticket list, new-ticket modal, threaded ticket detail modal |
| `/chat` | Chat | Full-screen Nova AI chat with session history sidebar |

#### Admin pages

| Route | Page | What it does |
|---|---|---|
| `/admin` | Dashboard | System-wide stats: users, accounts, total balance, transactions |
| `/admin/users` | Users | Full user table; add/edit/delete modals; enable/disable toggle |
| `/admin/accounts` | Accounts | All accounts with owner info; freeze/unfreeze; admin deposit |
| `/admin/transactions` | Transactions | All transactions across all accounts |
| `/admin/support` | Support | All tickets; status management; admin reply modal |

---

## 6. Feature Walkthroughs

### 6.1 Registration & Login

**Registration flow:**

```
Browser: POST /api/auth/register
  { email, full_name, password, mobile }

Backend:
  1. Check email uniqueness → 400 if taken
  2. Check mobile uniqueness → 400 if taken
  3. hash_password(password) → bcrypt hash
  4. INSERT INTO users (...)
  5. db.flush() → get user.id
  6. INSERT INTO accounts (user_id, type="savings", balance=0)
  7. db.commit()
  8. create_access_token({"sub": user.id, "role": "customer"})
  9. Return Token { access_token, token_type, user }

Frontend:
  10. AuthContext.login(token, user) → localStorage
  11. Navigate to /dashboard
```

**Login flow:**

```
Browser: POST /api/auth/login
  { email, password }

Backend:
  1. Query User by email → 401 if not found
  2. verify_password(password, user.hashed_password) → 401 if mismatch
  3. Check user.is_active → 403 if disabled
  4. create_access_token(...)
  5. Return Token

Frontend:
  6. AuthContext.login(token, user)
  7. Navigate based on role: /dashboard or /admin
```

### 6.2 OTP Login

OTP login is a two-step process:

```
Step 1 — Send OTP:
  POST /api/auth/otp/send  { mobile: "9876543210" }
  Backend:
    - Creates OtpSession row with otp_code = settings.demo_otp ("123456")
    - Returns { message, demo_otp: "123456" }
  (In production, this would call an SMS gateway)

Step 2 — Verify OTP:
  POST /api/auth/otp/verify  { mobile, otp_code }
  Backend:
    - Finds User by mobile → 404 if not found
    - Accepts otp_code if it equals settings.demo_otp OR matches a valid
      unexpired DB OtpSession
    - Creates JWT and returns Token
```

The demo OTP `123456` is always accepted, removing the need for a real SMS service during development.

### 6.3 Dashboard

The dashboard makes four parallel API calls on mount:

```
GET /api/dashboard/summary      → total balance, account counts
GET /api/dashboard/spending     → spending breakdown by category (last 30 days)
GET /api/dashboard/monthly-flow → inflow vs outflow per month (last 6 months)
GET /api/dashboard/insights     → AI-generated text insights
```

The `spending` and `monthly-flow` data drives Recharts `PieChart` and `BarChart` components. Insights are text strings generated by the backend by analysing the user's transaction history.

### 6.4 Accounts

Each account is displayed as a card with its balance, account number, account type, IFSC code, and status. Customers can:
- **Deposit** — `POST /transactions/deposit` — adds to balance
- **Withdraw** — `POST /transactions/withdraw` — deducts from balance (insufficient balance check on backend)

Frozen accounts show a badge and all transaction buttons are disabled.

### 6.5 Transfers (NEFT / RTGS / IMPS)

```
User fills transfer form:
  - Source account (dropdown from GET /accounts)
  - Destination account number
  - Transfer mode (NEFT / RTGS / IMPS)
  - Amount, description, beneficiary name

POST /api/transactions/transfer

Backend:
  1. Verify from_account belongs to current_user
  2. Verify from_account.status == "active"
  3. Verify amount > 0 and from_account.balance >= amount
  4. Query to_account by account_number
  5. Verify to_account.status == "active"
  6. Verify from_account.id != to_account.id
  7. Generate reference number: "{MODE}{YYYYMMDD}{8 random chars}"
  8. from_account.balance -= amount
  9. to_account.balance += amount
 10. INSERT INTO transactions (...)
 11. notify(sender) → debit alert
 12. notify(receiver, if NovBank user) → credit alert
 13. db.commit()
 14. Return Transaction
```

Beneficiaries can be saved in the Beneficiaries section and selected from a dropdown to pre-fill the form.

### 6.6 UPI Payments

UPI addresses (VPAs) must be registered before use:

```
Register VPA:
  POST /api/upi/vpas
  { vpa: "alice@novbank", linked_account_id: 3 }
  → Checks VPA uniqueness globally
  → First VPA for user is auto-set as primary

Resolve VPA (verify recipient before paying):
  GET /api/upi/resolve/{vpa}
  → Returns { vpa, name } if active, 404 otherwise

Pay:
  POST /api/upi/pay
  { sender_vpa, receiver_vpa, amount, note }
  Backend:
    1. Verify sender_vpa belongs to current_user
    2. Verify receiver_vpa exists and is active
    3. Verify sender_account has sufficient balance
    4. Debit sender, credit receiver
    5. INSERT into transactions (transfer_mode="UPI")
    6. INSERT into upi_transactions
    7. notify() both parties
    8. db.commit()
```

### 6.7 Credit Cards

The credit card bill payment flow:

```
User selects card, chooses source account, enters amount

POST /api/credit-cards/{card_id}/pay-bill
{ from_account_id, amount }

Backend:
  1. Verify card belongs to current_user
  2. Verify source account is active and has sufficient balance
  3. payment_amount = min(amount, card.outstanding_amount)
  4. account.balance -= payment_amount
  5. card.outstanding_amount -= payment_amount
  6. card.available_limit = card.credit_limit - card.outstanding_amount
  7. If outstanding_amount == 0: reset minimum_due = 0
  8. INSERT into transactions (mode="INTERNAL", category="other")
  9. INSERT into cc_transactions (type="payment")
 10. notify(user) → bill paid notification
 11. db.commit()
 12. Return updated CreditCard
```

The frontend receives the updated card object and the parent component's `onCardUpdate` callback refreshes the displayed outstanding balance immediately without a page reload.

### 6.8 Loans & EMI

EMI calculation uses the standard amortisation formula:

```
Monthly Rate (r) = interest_rate / 100 / 12
Interest Portion  = outstanding_amount × r
Principal Portion = EMI Amount − Interest Portion
New Outstanding   = outstanding_amount − Principal Portion
```

This correctly reduces the outstanding amount by only the principal component of each payment (not the full EMI), mirroring how real bank loans work.

```
POST /api/loans/{loan_id}/pay-emi
{ from_account_id }

Backend:
  1. Verify loan belongs to current_user, is not closed
  2. Verify account has balance >= loan.emi_amount
  3. Calculate interest and principal portions
  4. account.balance -= emi_amount
  5. loan.outstanding_amount -= principal_portion
  6. Count existing EmiPayment rows → installment_number = count + 1
  7. INSERT EmiPayment(installment_number, amount_paid, status="paid")
  8. Advance next_due_date by 30 days
  9. If outstanding_amount <= 0: loan.status = "closed"
 10. notify(user) → EMI paid (or "Loan Closed")
 11. db.commit()
 12. Return summary dict
```

The loan schedule (`GET /loans/{id}/schedule`) calculates all future EMIs without writing to the DB, projecting the amortisation table from the current outstanding amount.

### 6.9 Transaction History & Reports

**Filtering:** `GET /api/transactions` accepts these query parameters:
- `skip`, `limit` — pagination
- `date_from`, `date_to` — ISO date strings (inclusive range)
- `category` — e.g., "food", "transfer"
- `transfer_mode` — e.g., "UPI", "NEFT"
- `transaction_type` — "deposit", "withdrawal", "transfer"
- `account_id` — restrict to one account

The backend queries transactions where `from_account_id` OR `to_account_id` belongs to the current user (so both sent and received transfers appear in history).

**CSV Export:** `GET /api/reports/transactions/csv` generates a CSV of the same filtered data. Because browser navigations (file downloads) cannot set the `Authorization` header, the endpoint accepts the token as a `?token=` query parameter. The frontend builds a URL like:

```
/api/reports/transactions/csv?date_from=...&date_to=...&token=eyJ...
```

And navigates to it with `window.open()`.

### 6.10 Notifications

The notification system has two surfaces:

**Sidebar badge:** Polls `GET /api/notifications/unread-count` every 60 seconds and shows a red count bubble on the Notifications nav item.

**Notifications page (`/notifications`):**
- All / Unread tabs
- Clicking a notification marks it read (`PATCH /{id}/read`) and navigates to `related_url`
- Hover shows a delete button (`DELETE /{id}`)
- "Mark All Read" button calls `PATCH /read-all`

Notifications are created server-side (never client-side) by the `notify()` helper in `backend/app/services/notifications.py`. They are always committed in the same database transaction as the event that triggered them.

### 6.11 Customer Support Tickets

**Customer side:**

```
Create ticket:
  POST /api/support
  { subject, category, priority, message }
  Backend:
    - Generates ticket_number: "TKT-" + zero-padded counter
    - Creates SupportTicket + first SupportMessage
    - Returns ticket with messages

Reply to ticket:
  POST /api/support/{ticket_id}/reply
  { message }

List own tickets:
  GET /api/support
  
Get ticket with all messages:
  GET /api/support/{ticket_id}
```

**Admin side:**

```
GET  /api/support/admin/tickets              ← all tickets
PATCH /api/support/admin/tickets/{id}/status  { status }
  → Updates ticket status
  → Triggers notify(ticket.user_id) with new status
  
POST /api/support/admin/tickets/{id}/reply   { message }
  → Inserts SupportMessage(is_admin_reply=True)
  → Triggers notify(ticket.user_id)
```

When an admin replies or changes ticket status, the customer receives an in-app notification with a link directly to the support page.

### 6.12 Nova AI Chatbot

Nova is the centrepiece of the application's AI features. It is implemented in two layers: a frontend UI (widget + dedicated page) and a backend service.

#### Frontend

**ChatWidget (`components/chat/ChatWidget.tsx`)**

A floating button fixed to the bottom-right corner of every authenticated customer page (injected by `BankingLayout`). It is invisible to admin users.

When clicked, it expands into a 400×580 px chat panel with:
- Animated open/close (Framer Motion spring)
- Bot avatar, typing indicator (3 bouncing dots animated with Framer Motion)
- Quick-action chips on the welcome screen
- Optimistic UI: user message appears instantly, typing dots show while waiting for AI
- Basic `**bold**` markdown rendering (inline regex split)
- Auto-scroll to newest message
- New Chat button (creates a fresh session)
- Enter to send, Shift+Enter for newline

On first open, a new session is created via `POST /api/chat/sessions`. Subsequent opens keep the same session in memory (stored in component state) until the user refreshes or starts a new chat.

**Chat page (`pages/customer/Chat.tsx`)**

A full-screen dedicated chat interface at `/chat` with:
- Left sidebar listing all past sessions (last 20, ordered by most recent activity)
- Session switching (loads full message history)
- Session deletion
- Same message bubble and typing indicator components as the widget
- An empty state with an 8-item "Try asking" grid

#### Backend

**Session lifecycle:**

```
POST /api/chat/sessions
  1. Creates ChatSession row (title="New Conversation")
  2. Creates welcome ChatMessage(role="assistant") with personalised greeting
  3. Returns ChatSessionDetail with all messages

POST /api/chat/sessions/{id}/message
  { content: "What is my balance?" }
  1. Verifies session belongs to current_user
  2. Inserts user ChatMessage
  3. Auto-titles session from first user message (first 60 chars + "…")
  4. Builds conversation history list (all prior messages except latest)
  5. Calls get_ai_response(user, db, history, user_message)
  6. Inserts assistant ChatMessage with AI's reply
  7. Updates session.updated_at
  8. Returns the assistant ChatMessage
```

**AI response generation (`services/ai_chat.py`):**

```
get_ai_response(user, db, history, user_message)
  ↓
  Is ANTHROPIC_API_KEY set?
    Yes → Claude API path
    No  → Rule-based fallback
```

**Claude API path:**

1. `_build_context(user, db)` queries the database to assemble a real-time context string:
   - All accounts with balance and status
   - Last 5 transactions (with credit/debit direction)
   - All active loans (outstanding, EMI, next due date)
   - All active credit cards (outstanding, available limit, min due)
2. The context is injected into a system prompt that defines Nova's personality, capabilities, and rules (always use ₹, never ask for passwords, etc.)
3. Up to the last 12 messages from the session are included as conversation history
4. The Anthropic client sends a `messages.create` request with `claude-haiku-4-5-20251001` and `max_tokens=1024`
5. The response text is returned

**Rule-based fallback (when no API key):**

`_rule_based_response()` uses keyword matching against the user's message and queries the database for real data:
- "balance" / "how much" → actual account balances from DB
- "transaction" / "history" → last 5 transactions from DB
- "loan" / "emi" → active loans from DB
- "credit card" / "outstanding" → active cards from DB
- "transfer" / "neft" / "rtgs" → guidance text
- "calculate" → EMI calculator guidance
- greetings → personalised hello

This means the chatbot provides useful, data-driven answers even without an API key.

**Error handling:** If the Anthropic API call raises any exception (network error, rate limit, API error), the code falls back to `_rule_based_response()` automatically.

#### Data persistence

Every message (both user and assistant) is persisted to the `chat_messages` table. Sessions are stored in `chat_sessions`. This means:
- Conversation history survives page refreshes
- Users can return to any previous session
- Sessions can be deleted (cascade deletes all messages)

### 6.13 Admin Panel

**User management (`/admin/users`):**

```
Create user:
  POST /api/admin/users
  { email, full_name, password, mobile, role, kyc_status, create_account }
  → Hashes password, creates User
  → If create_account=true, creates a savings Account

Edit user:
  PATCH /api/admin/users/{id}
  { full_name?, email?, mobile?, kyc_status?, password? }
  → Only provided fields are updated
  → Password is re-hashed if provided

Delete user:
  DELETE /api/admin/users/{id}
  → Refuses to delete admin accounts
  → Cascade deletes all accounts, transactions, cards, loans, notifications, tickets, chats

Enable/Disable user:
  PATCH /api/admin/users/{id}
  { is_active: false }
  → Prevents login (403 on next login attempt)
```

**Admin deposit:**

```
POST /api/admin/deposit
{ account_id, amount, description }
→ account.balance += amount
→ INSERT transaction (type="deposit")
→ notify(account owner) → credit alert
```

**Account freeze/unfreeze:**

```
PATCH /api/admin/accounts/{id}/freeze
PATCH /api/admin/accounts/{id}/unfreeze
→ Sets account.status = "frozen" or "active"
→ Frozen accounts cannot send or receive transfers
```

---

## 7. API Reference

Full interactive documentation is available at **http://localhost:8000/api/docs** (Swagger UI) when the backend is running.

### Authentication

All endpoints except `/api/auth/*` and `/api/health` require:
```
Authorization: Bearer <JWT>
```

### Common response codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | Deleted (no body) |
| 400 | Business rule violation (e.g., insufficient balance) |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 422 | Request validation error (Pydantic) |

### Key request shapes

**Transfer:**
```json
POST /api/transactions/transfer
{
  "from_account_id": 1,
  "to_account_number": "ACC1234567890",
  "amount": 5000.00,
  "transfer_mode": "IMPS",
  "beneficiary_name": "Bob",
  "to_ifsc": "NOVB0001001",
  "description": "Rent payment"
}
```

**UPI Pay:**
```json
POST /api/upi/pay
{
  "sender_vpa": "alice@novbank",
  "receiver_vpa": "bob@novbank",
  "amount": 500.00,
  "note": "Lunch split"
}
```

**Send Chat Message:**
```json
POST /api/chat/sessions/{id}/message
{
  "content": "What is my account balance?"
}
```

---

## 8. Data Flow Diagrams

### Login

```
Browser                    Frontend                  Backend               DB
  │                            │                        │                   │
  │──[enter credentials]──────▶│                        │                   │
  │                            │──POST /auth/login─────▶│                   │
  │                            │                        │──SELECT users────▶│
  │                            │                        │◀─User row─────────│
  │                            │                        │ verify_password() │
  │                            │                        │ create_access_token│
  │                            │◀──Token + User─────────│                   │
  │                            │ AuthContext.login()    │                   │
  │                            │ → localStorage         │                   │
  │◀──Navigate /dashboard──────│                        │                   │
```

### Transfer

```
Customer page                 API Client            Backend               DB
  │                               │                    │                   │
  │──[submit form]───────────────▶│                    │                   │
  │                               │──POST /transfer───▶│                   │
  │                               │                    │ validate inputs   │
  │                               │                    │──UPDATE accounts──▶│  (debit+credit)
  │                               │                    │──INSERT transaction▶│
  │                               │                    │──INSERT 2 notifs──▶│
  │                               │                    │ db.commit()        │
  │                               │◀──Transaction obj──│                   │
  │◀──toast "Transfer success"────│                    │                   │
  │  update UI balance            │                    │                   │
```

### Nova Chat Message

```
ChatWidget/ChatPage      api/chat.ts         /chat route        ai_chat.py        Anthropic API
      │                      │                   │                  │                  │
      │─[user types msg]────▶│                   │                  │                  │
      │ [optimistic update]  │                   │                  │                  │
      │                      │──POST /message───▶│                  │                  │
      │                      │                   │──save user msg──▶DB                 │
      │                      │                   │──get_ai_response▶│                  │
      │                      │                   │                  │─_build_context──▶DB
      │                      │                   │                  │ (accounts/txns/  │
      │                      │                   │                  │  loans/cards)    │
      │                      │                   │                  │                  │
      │                      │                   │                  │ (if API key set) │
      │                      │                   │                  │──messages.create▶│
      │                      │                   │                  │◀──AI text────────│
      │                      │                   │                  │ (else: rule-based│
      │                      │                   │                  │  response())     │
      │                      │                   │◀─ai_text─────────│                  │
      │                      │                   │──save asst msg──▶DB                 │
      │                      │◀──ChatMessageOut──│                  │                  │
      │◀─[display reply]─────│                   │                  │                  │
      │  [hide typing dots]  │                   │                  │                  │
```

---

## 9. Security Model

### What is protected

- All financial operations (transfer, pay, deposit, withdraw) require a valid JWT
- All admin operations require both a valid JWT and `user.role == "admin"`
- Password hashes are stored with bcrypt (work factor controlled by passlib default)
- JWTs are signed with HS256 and expire after 24 hours
- The `secret_key` should be changed to a random 32+ character string in production

### What is intentionally simplified (demo)

- SQLite is used instead of PostgreSQL — not suitable for concurrent production load
- `secret_key` has a hardcoded development default
- OTP is always `123456` — no real SMS gateway
- CORS allows all origins from localhost:3000 only (must be updated for deployment)
- No rate limiting on login or OTP endpoints
- No HTTPS enforcement (handled by a reverse proxy in production)
- Token stored in `localStorage` (vulnerable to XSS; use `httpOnly` cookie in production)

### Admin restrictions

- Admins cannot disable other admin accounts (enforced in `DELETE /admin/users/{id}`)
- Admins cannot freeze their own accounts

---

## 10. Development Setup

### Prerequisites

- Python 3.12
- Node.js 18+ (via nvm recommended)
- Git

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements-dev.txt

# Configure environment
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY if you want Claude AI responses

# Seed demo data (run once)
python seed.py

# Start server
uvicorn app.main:app --reload    # http://localhost:8000
```

### Frontend

```bash
cd frontend

# Install dependencies (if using nvm: source ~/.nvm/nvm.sh first)
npm install

# Start dev server
npm run dev                      # http://localhost:3000
```

The Vite dev server proxies `/api/*` to `http://localhost:8000`, so both servers must be running simultaneously.

### Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@novbank.com | Admin@123 |
| Customer | alice@example.com | Alice@123 |
| Customer | bob@example.com | Bob@123 |

OTP login: any registered mobile number, OTP = `123456`

### Quality checks

```bash
# Backend
cd backend && source .venv/bin/activate
ruff check .          # linting
mypy app/             # type checking
pytest tests/unit/    # unit tests

# Frontend
cd frontend
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
npm test              # Vitest
```

### Enable Claude AI for Nova

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. In `backend/.env`, set: `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart the backend
4. Nova will now use `claude-haiku-4-5-20251001` for all chat responses

Without an API key, Nova uses the rule-based fallback which queries real account data and returns accurate responses for balance, transaction, loan, and card queries.
