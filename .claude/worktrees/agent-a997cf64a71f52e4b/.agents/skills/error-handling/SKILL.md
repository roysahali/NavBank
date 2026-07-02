# SKILL.md — Error Handling

## Error Response Shape

All API errors return a consistent shape:

```typescript
// Standard error response
interface ErrorResponse {
  error: {
    code: string;          // Machine-readable: "VALIDATION_ERROR", "NOT_FOUND"
    message: string;       // Human-readable: "Email is already registered"
    details?: unknown;     // Optional: field-level errors, debug info
  };
}

// Standard success response
interface SuccessResponse<T> {
  data: T;
}
```

### HTTP Status Codes
| Code | When | Example |
|------|------|---------|
| 200 | Success (GET, PUT, PATCH) | Fetched/updated resource |
| 201 | Created (POST) | New resource created |
| 204 | No content (DELETE) | Resource deleted |
| 400 | Bad request | Invalid input, validation failure |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not found | Resource doesn't exist |
| 409 | Conflict | Duplicate email, version conflict |
| 422 | Unprocessable | Valid syntax but semantic error |
| 429 | Too many requests | Rate limit exceeded |
| 500 | Internal server error | Unexpected server failure |

## API Route Error Handling

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation errors → 400
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        },
      }, { status: 400 });
    }

    // Business logic
    const result = await doSomething(parsed.data);

    return Response.json({ data: result }, { status: 201 });

  } catch (error) {
    // Known application errors
    if (error instanceof AppError) {
      return Response.json({
        error: { code: error.code, message: error.message },
      }, { status: error.statusCode });
    }

    // Unknown errors → 500 (don't expose internals)
    console.error('Unhandled error:', error);
    return Response.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
```

## Application Error Class

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Specific error factories
export const Errors = {
  notFound: (resource: string) =>
    new AppError('NOT_FOUND', `${resource} not found`, 404),
  duplicate: (field: string) =>
    new AppError('DUPLICATE', `${field} already exists`, 409),
  unauthorized: () =>
    new AppError('UNAUTHORIZED', 'Authentication required', 401),
  forbidden: () =>
    new AppError('FORBIDDEN', 'Insufficient permissions', 403),
  validation: (message: string) =>
    new AppError('VALIDATION_ERROR', message, 400),
};

// Usage
throw Errors.notFound('User');
throw Errors.duplicate('email');
```

## Client-Side Error Handling

```typescript
// Utility for API calls
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      error.error.code,
      error.error.message,
      response.status,
    );
  }

  const { data } = await response.json();
  return data as T;
}
```

## React Error Boundaries

```typescript
// For route-level error catching
// app/dashboard/error.tsx
'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Logging Rules

### Do Log
- Error details (stack trace, error code)
- Request context (method, path, user ID — not full body)
- Timing information for performance monitoring
- Auth failures (for security monitoring)

### Don't Log
- Passwords, tokens, API keys
- Full request/response bodies (PII risk)
- Sensitive user data (SSN, credit card)
- Health check pings (noise)

### Log Levels
| Level | When |
|-------|------|
| `error` | Something broke — needs attention |
| `warn` | Something concerning — should investigate |
| `info` | Normal operations — audit trail |
| `debug` | Development details — off in production |

## Async Error Patterns

```typescript
// Always catch async errors — unhandled promise rejections crash Node.js

// GOOD
try {
  await sendEmail(to, template);
} catch (error) {
  console.error('Email send failed:', error);
  // Don't let email failure break the main flow
  // Queue for retry or log for manual follow-up
}

// BAD — fire and forget without catch
sendEmail(to, template); // If this rejects, it's an unhandled rejection
```

## Never Expose Internals

```typescript
// BAD — leaks implementation details
return Response.json({
  error: 'PrismaClientKnownRequestError: Unique constraint failed on email',
}, { status: 500 });

// GOOD — user-friendly, safe
return Response.json({
  error: { code: 'DUPLICATE', message: 'This email is already registered' },
}, { status: 409 });
```
