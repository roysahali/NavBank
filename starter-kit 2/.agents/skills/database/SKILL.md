# SKILL.md — Database

## Overview
Standards for database schema design, querying, and optimisation. Apply whenever designing tables, writing queries, or configuring an ORM. These rules prevent the most common performance and integrity problems.

---

## Schema Design Rules

### Naming
- Tables: plural snake_case — `users`, `order_items`, `payment_methods`
- Columns: singular snake_case — `user_id`, `created_at`, `is_active`
- Foreign keys: `{referenced_table_singular}_id` — `user_id`, `product_id`
- Indexes: `idx_{table}_{columns}` — `idx_orders_user_id`, `idx_users_email`
- Junction tables: `{table_a}_{table_b}` alphabetical — `role_users`, not `user_roles`

### Primary keys
✅ UUID for distributed systems and externally-exposed IDs:
```sql
id UUID DEFAULT gen_random_uuid() PRIMARY KEY
```
✅ Auto-increment integer for internal-only, high-volume tables:
```sql
id BIGSERIAL PRIMARY KEY
```
❌ Never expose auto-increment integers in public APIs — reveals record counts

### Timestamps — always on every table
```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at  TIMESTAMPTZ  -- NULL = active, non-NULL = soft-deleted
```

### Soft delete over hard delete
✅ `deleted_at IS NULL` filter — data preserved, recoverable
❌ `DELETE FROM users` — irreversible, breaks foreign keys in history

---

## Indexing Rules

Index columns that appear in:
- `WHERE` clauses frequently
- `JOIN` conditions
- `ORDER BY` on large result sets
- Foreign key columns (most ORMs don't auto-create these)

```sql
-- Every foreign key needs an index
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Columns used in WHERE filters
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token ON sessions(token) WHERE deleted_at IS NULL;

-- Composite index: column order matters — most selective first
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
-- Supports: WHERE user_id = X AND status = Y
-- Also supports: WHERE user_id = X (prefix match)
-- Does NOT support: WHERE status = Y alone
```

Never index every column — indexes slow writes. Only add indexes for proven query patterns.

---

## Query Rules

### No raw SQL — use parameterised queries or ORM
✅ Safe:
```typescript
db.query('SELECT * FROM users WHERE id = $1', [userId])
prisma.user.findUnique({ where: { id: userId } })
```
❌ Injection risk:
```typescript
db.query(`SELECT * FROM users WHERE id = '${userId}'`)
```

### SELECT only needed columns
✅ `SELECT id, name, email FROM users WHERE id = $1`
❌ `SELECT * FROM users` — fetches blobs, JSON, and unused columns

### Always LIMIT unbounded queries
```sql
SELECT * FROM events ORDER BY created_at DESC LIMIT 100;
```

### Transactions for multi-step writes
```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({ where: { id: itemId }, data: { quantity: { decrement: 1 } } });
  await tx.payment.create({ data: { orderId: order.id, amount } });
});
```

---

## Checklist

- [ ] Every table has `id`, `created_at`, `updated_at`
- [ ] Soft delete used (`deleted_at`) rather than hard delete
- [ ] Every foreign key column has an index
- [ ] No `SELECT *` in application code
- [ ] No string-concatenated SQL queries
- [ ] All multi-step writes wrapped in transactions
- [ ] Unbounded queries have LIMIT applied
