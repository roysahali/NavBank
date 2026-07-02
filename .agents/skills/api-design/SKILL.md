# SKILL.md — API Design

## Route Structure

### RESTful Conventions
```
GET    /api/users          → List users
POST   /api/users          → Create user
GET    /api/users/:id      → Get user by ID
PUT    /api/users/:id      → Replace user
PATCH  /api/users/:id      → Partial update
DELETE /api/users/:id      → Delete user
```

### Nested Resources
```
GET    /api/users/:id/posts     → List user's posts
POST   /api/users/:id/posts     → Create post for user
```

### Max nesting: 2 levels. Beyond that, use top-level routes:
```
# Don't do this
GET /api/users/:id/posts/:postId/comments/:commentId

# Do this instead
GET /api/comments/:commentId
```

## Request/Response Shapes

### Success Response
```typescript
// Single resource
{ "data": { "id": "usr_123", "email": "user@example.com", "name": "User" } }

// Collection
{
  "data": [
    { "id": "usr_123", "email": "user@example.com" },
    { "id": "usr_456", "email": "other@example.com" }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "perPage": 20,
    "totalPages": 3
  }
}
```

### Error Response
```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "email": ["Invalid email format"] }
  }
}
```

### Creation Response
```typescript
// POST returns the created resource with 201
{ "data": { "id": "usr_789", "email": "new@example.com", "name": "New User" } }
```

## Input Validation

### Always Use Zod Schemas
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

const updateUserSchema = createUserSchema.partial(); // All fields optional for PATCH

const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name', 'createdAt', 'email']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});
```

### Validate at Route Level
```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() },
    }, { status: 400 });
  }

  // parsed.data is now fully typed and validated
  const user = await createUser(parsed.data);
  return Response.json({ data: user }, { status: 201 });
}
```

## Pagination

### Offset-Based (Simple)
```typescript
// Request
GET /api/users?page=2&perPage=20

// Response
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "perPage": 20,
    "totalPages": 8
  }
}
```

### Cursor-Based (For Large Datasets)
```typescript
// Request
GET /api/posts?cursor=post_abc123&limit=20

// Response
{
  "data": [...],
  "pagination": {
    "nextCursor": "post_xyz789",  // null if no more
    "hasMore": true
  }
}
```

## Authentication Pattern

```typescript
// Middleware or helper
async function requireAuth(request: Request): Promise<Session> {
  const session = await getSession(request);
  if (!session) {
    throw Errors.unauthorized();
  }
  return session;
}

// In route handler
export async function GET(request: Request) {
  const session = await requireAuth(request);
  // session.user is now available
}
```

## Rate Limiting

Apply rate limiting to:
- Auth endpoints (login, register) — strict: 5-10 per minute
- Write endpoints (POST, PUT, DELETE) — moderate: 30-60 per minute
- Read endpoints — lenient: 100-200 per minute

Return appropriate headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
Retry-After: 30    ← only on 429 responses
```

## Route Handler Template

```typescript
import { z } from 'zod';

const schema = z.object({ /* ... */ });

export async function POST(request: Request) {
  try {
    // 1. Auth (if needed)
    const session = await requireAuth(request);

    // 2. Parse & validate
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() },
      }, { status: 400 });
    }

    // 3. Business logic
    const result = await doSomething(parsed.data, session.user);

    // 4. Response
    return Response.json({ data: result }, { status: 201 });

  } catch (error) {
    // 5. Error handling (use error-handling skill patterns)
    if (error instanceof AppError) {
      return Response.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    console.error('Unhandled:', error);
    return Response.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
```

## ID Format
- Use prefixed UUIDs for readability: `usr_`, `post_`, `org_`
- Or use cuid2 / nanoid for shorter IDs
- Never expose auto-increment integer IDs externally
