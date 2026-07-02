# SKILL.md — Documentation

## Code Comments

### When to Comment
- **Why**, not what — the code shows what, comments explain why
- Non-obvious business logic or domain rules
- Workarounds with context (link to issue/PR)
- Public API contracts (JSDoc on exported functions)

### When NOT to Comment
- Self-explanatory code (`// increment counter` above `counter++`)
- Commented-out code — delete it, git has history
- TODOs without context — if you must, include a ticket/issue reference

### JSDoc for Exports
```typescript
/**
 * Creates a new user account with hashed password.
 *
 * @param input - User registration data (validated)
 * @returns The created user without sensitive fields
 * @throws {AppError} DUPLICATE if email already registered
 * @throws {AppError} VALIDATION_ERROR if input fails constraints
 */
export async function createUser(input: CreateUserInput): Promise<SafeUser> {
  // ...
}
```

### Inline Comments
```typescript
// Rate limit: 5 attempts per 15 minutes per IP
// See: https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks
const rateLimiter = new RateLimit({ window: 15 * 60, max: 5 });

// Using jose instead of jsonwebtoken — CJS/ESM compatibility
// See: https://github.com/panva/jose
import { SignJWT } from 'jose';
```

## README.md

Every project should have a README with:

```markdown
# Project Name

Brief description of what this project does.

## Quick Start

\`\`\`bash
# Prerequisites
node --version  # >= 20.x
npm --version   # >= 10.x

# Install
npm install

# Environment setup
cp .env.example .env
# Edit .env with your values

# Database
npx prisma migrate dev

# Run
npm run dev
\`\`\`

## Tech Stack
- Framework, language, database, key libraries

## Project Structure
Brief overview of key directories.

## Scripts
| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `npm run lint` | Lint code |

## Environment Variables
| Variable | Required | Description |
|----------|----------|------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |

## Development Workflow
Brief description of how development works on this project.
```

## Changelog

### Format (Keep a Changelog)
```markdown
# Changelog

## [Unreleased]

## [1.1.0] - 2024-03-15
### Added
- User profile editing
- Avatar upload with image optimization

### Fixed
- Session expiry not redirecting to login

### Changed
- Upgraded Prisma to 5.9.0

## [1.0.0] - 2024-03-01
### Added
- Initial release with auth, dashboard, and settings
```

### Rules
- Group by: Added, Changed, Deprecated, Removed, Fixed, Security
- Most recent version at top
- Link version headers to git tags/diffs
- Write for humans, not machines

## API Documentation

### Inline with Route Handlers
```typescript
/**
 * POST /api/users
 *
 * Creates a new user account.
 *
 * Body:
 *   - email: string (required) — Valid email address
 *   - password: string (required) — Min 8 characters
 *   - name: string (required) — Display name
 *
 * Returns:
 *   201: { data: User } — Created user (without password)
 *   400: { error } — Validation failure
 *   409: { error } — Email already registered
 *
 * Auth: None (public endpoint)
 * Rate limit: 5/min per IP
 */
export async function POST(request: Request) { }
```

## Decision Records

For significant architectural or technical decisions, document in `.planning/`:

```markdown
# Decision: Use Prisma over Drizzle for ORM

## Date
2024-03-01

## Status
Accepted

## Context
Need an ORM for PostgreSQL. Team evaluated Prisma and Drizzle.

## Decision
Use Prisma because: type-safe migrations, better documentation, team familiarity.

## Consequences
- Slightly larger bundle size than Drizzle
- Prisma Client generation step required
- Strong migration tooling out of the box
```

## Documentation Don'ts
- Don't document what the code already says clearly
- Don't write docs that will immediately go stale
- Don't document internal implementation that changes frequently
- Don't write walls of text — use examples and tables
- Don't copy-paste documentation from libraries — link to it instead
