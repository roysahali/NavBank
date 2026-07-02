# SKILL.md — Data Migration

## Overview
Rules for writing data migration scripts in re-architecture projects. Apply whenever moving data from an old schema to a new one. Every migration must be safe, reversible, and testable.

---

## The Three Non-Negotiable Rules

1. **Idempotent** — safe to run multiple times without corrupting data
2. **Reversible** — every UP script has a DOWN/rollback script
3. **Tested** — run against a production data copy before touching production

---

## Script Structure

Every migration file must have this structure:

```sql
-- Migration: {name}
-- Ticket: {issue reference}
-- Tables affected: {list}
-- Reversible: YES
-- Idempotent: YES
-- Estimated runtime: {N} seconds on {N} rows

BEGIN;

-- Idempotency guard (skip if already applied)
INSERT INTO _migrations (name, applied_at)
VALUES ('{name}', NOW())
ON CONFLICT (name) DO NOTHING;

-- If already applied, exit cleanly
DO $$ BEGIN
  IF (SELECT applied_at FROM _migrations WHERE name = '{name}') IS NOT NULL
     AND (SELECT COUNT(*) FROM _migrations WHERE name = '{name}') > 0
  THEN RETURN; END IF;
END $$;

-- ── Migration body ─────────────────────────────────
{transformation SQL here}
-- ────────────────────────────────────────────────────

COMMIT;
```

---

## Transformation Patterns

### Safe column rename

✅ Add new column, populate, drop old — never rename directly in production:
```sql
ALTER TABLE users ADD COLUMN full_name TEXT;
UPDATE users SET full_name = first_name || ' ' || last_name WHERE full_name IS NULL;
-- Drop old columns in a separate migration after verifying
```

### Enum/type transformation

✅ Always map exhaustively — never silently drop unknown values:
```sql
UPDATE orders SET status_new = CASE status_old
  WHEN 0 THEN 'pending'
  WHEN 1 THEN 'active'
  WHEN 2 THEN 'complete'
  ELSE 'unknown' -- capture unknowns, don't discard
END;

-- Verify no unknowns slipped through
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM orders WHERE status_new = 'unknown') THEN
    RAISE EXCEPTION 'Unknown status values found — migration incomplete';
  END IF;
END $$;
```

### Splitting a table

✅ Insert with NOT EXISTS guard (idempotency):
```sql
INSERT INTO profiles (user_id, bio, avatar_url, updated_at)
SELECT id, profile_bio, avatar, updated_at
FROM old_users
WHERE profile_bio IS NOT NULL
  AND id NOT IN (SELECT user_id FROM profiles);
```

---

## Validation Checks (include in every script)

```sql
-- After migration, verify data integrity
DO $$ DECLARE
  missing_count INT;
BEGIN
  SELECT COUNT(*) INTO missing_count FROM new_table WHERE required_field IS NULL;
  IF missing_count > 0 THEN
    RAISE EXCEPTION '% rows have NULL required_field after migration', missing_count;
  END IF;
END $$;
```

---

## Testing Checklist

Before any migration PR can merge:

- [ ] Migration script tested against a copy of production data
- [ ] Row counts match between old and new tables
- [ ] No NULL values in required fields after migration
- [ ] No orphaned foreign keys
- [ ] Idempotency tested (run migration twice — counts unchanged)
- [ ] Rollback script tested (applies cleanly after the UP migration)
- [ ] Estimated runtime measured on realistic data volume
- [ ] MIGRATION-RESULTS.md written with all counts and outcomes

---

## What Never to Do

❌ Never `DROP TABLE` in the same script that migrates data — verify first, drop in a follow-up migration
❌ Never run migrations without a transaction (`BEGIN`/`COMMIT`) unless the operation is not transactional by nature
❌ Never assume NULL means empty string — handle both explicitly
❌ Never migrate directly to production — always a copy first
❌ Never write a migration without a rollback
