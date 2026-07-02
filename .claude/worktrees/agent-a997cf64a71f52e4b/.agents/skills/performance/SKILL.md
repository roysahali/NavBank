# SKILL.md — Performance

## Overview
Performance standards to write into code from the start. Apply to every database query, API endpoint, and frontend component. These rules prevent the most common regressions.

---

## Database Rules

### Always paginate list queries

✅ Do this:
```typescript
async function getUsers(page = 1, limit = 20) {
  return db.users.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}
```

❌ Not this:
```typescript
async function getUsers() {
  return db.users.findAll(); // full table scan
}
```

### Never query inside a loop (N+1)

✅ Do this — batch load:
```typescript
const userIds = orders.map(o => o.userId);
const users = await db.users.findMany({ where: { id: { in: userIds } } });
const userMap = Object.fromEntries(users.map(u => [u.id, u]));
```

❌ Not this:
```typescript
for (const order of orders) {
  order.user = await db.users.findOne(order.userId); // N queries!
}
```

### Select only what you need

✅ Do this:
```typescript
db.users.findMany({ select: { id: true, name: true, email: true } })
```

❌ Not this:
```typescript
db.users.findMany() // fetches all columns including large blobs
```

### Index columns you filter or sort by
```sql
-- Add an index for every column used in WHERE or ORDER BY
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

---

## API Rules

- Response time target: p95 < 500ms (reads), p95 < 1000ms (writes)
- Every list endpoint must accept `page` and `limit` params
- Cache responses that don't change per request (use ETags or Cache-Control)
- Never block the event loop with synchronous operations

---

## Frontend Rules

- Bundle size target: < 500KB JS (uncompressed)
- Code-split routes — don't load the whole app upfront
- Images need width/height to prevent layout shift
- Lazy-load images below the fold

---

## Checklist

- [ ] No queries inside loops
- [ ] All list endpoints are paginated
- [ ] SELECT specifies columns (no SELECT *)
- [ ] New queried columns have indexes
- [ ] No synchronous blocking calls in async paths
- [ ] API response time measured and within SLA
