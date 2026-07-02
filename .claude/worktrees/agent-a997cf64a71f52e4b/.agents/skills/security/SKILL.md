# SKILL.md — Security Rules

## Secrets Management

### Never Hardcode
- API keys, tokens, passwords, connection strings → always use environment variables
- No secrets in source code, even in comments or examples
- No secrets in git history — if leaked, rotate immediately

### Environment Variables
```bash
# .env.example (committed — placeholder values only)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="generate-a-real-secret-here"
RESEND_API_KEY="re_xxxxxxxxxxxx"

# .env (never committed — real values)
DATABASE_URL="postgresql://real_user:real_pass@real-host:5432/prod_db"
```

### Accessing Secrets
```typescript
// Always validate env vars exist at startup
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
```

## Input Validation

### Validate Everything from Users
```typescript
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

// In route handler
const result = registerSchema.safeParse(body);
if (!result.success) {
  return Response.json({ error: result.error.flatten() }, { status: 400 });
}
// Use result.data — it's now typed and validated
```

### Rules
- Validate on the server, always — client-side validation is UX, not security
- Use Zod schemas (or equivalent) — never manual validation
- Reject unexpected fields — don't just ignore them
- Validate file uploads: type, size, content (not just extension)
- Sanitize HTML output to prevent XSS

## Authentication

### Password Handling
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hashing
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// Verification
const isValid = await bcrypt.compare(password, hash);
```

### Rules
- Never store plaintext passwords
- Use bcrypt with 12+ salt rounds (or argon2)
- Never log passwords, even hashed
- Implement rate limiting on auth endpoints
- Lock accounts after N failed attempts (or use exponential backoff)

### JWT / Sessions
```typescript
// Use httpOnly cookies — not localStorage
// Set secure flags
const cookieOptions = {
  httpOnly: true,     // Not accessible via JavaScript
  secure: true,       // HTTPS only
  sameSite: 'lax',    // CSRF protection
  maxAge: 60 * 60,    // 1 hour
  path: '/',
};
```

### Rules
- Short-lived access tokens (15min-1hr)
- Refresh tokens with rotation (invalidate old on use)
- Store tokens in httpOnly cookies — NEVER in localStorage/sessionStorage
- Include CSRF protection for cookie-based auth

## Authorization

### Check Permissions Server-Side
```typescript
// Every protected route must verify
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check specific permission
  if (!session.user.roles.includes('admin')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with authorized logic
}
```

### Rules
- Never trust client-side role checks — always verify server-side
- Principle of least privilege — grant minimum necessary access
- Check ownership — user A shouldn't access user B's data
- Log authorization failures for monitoring

## SQL / Database

### Parameterized Queries Only
```typescript
// GOOD: Parameterized (Prisma does this automatically)
const user = await db.user.findUnique({ where: { email } });

// GOOD: Raw query with parameters
const users = await db.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// BAD: String concatenation — SQL INJECTION VULNERABILITY
const users = await db.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
```

### Rules
- Use ORM (Prisma) for standard queries
- If raw SQL needed, always use parameterized queries
- Never build SQL from user input via string concatenation
- Validate and sanitize even before parameterized queries

## API Security

### Rate Limiting
```typescript
// Apply to auth endpoints, form submissions, API routes
// Use a library like rate-limiter-flexible or upstash ratelimit
```

### CORS
```typescript
// Only allow your domains
const allowedOrigins = [
  'https://yourdomain.com',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000',
].filter(Boolean);
```

### Headers
```typescript
// Security headers (Next.js next.config.js or middleware)
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];
```

## Data Exposure

### Never Return Sensitive Fields
```typescript
// BAD
return Response.json(user); // includes password hash, internal IDs

// GOOD
const { password, internalId, ...safeUser } = user;
return Response.json(safeUser);
```

### Rules
- Define explicit response shapes — never return raw database objects
- Strip internal fields: password hashes, internal IDs, metadata
- Log carefully — don't log PII, passwords, tokens, or full request bodies
- Error messages should be helpful but not reveal internals

## Dependency Security
- Run `npm audit` regularly
- Keep dependencies updated (especially security patches)
- Prefer well-maintained packages with active communities
- Review new dependencies before installing — check download counts, last publish date, open issues
