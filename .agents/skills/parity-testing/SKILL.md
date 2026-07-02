# SKILL.md — Parity Testing

## Overview
Rules for writing parity tests in re-architecture projects. Parity tests are the contract between the old system's behaviour and the new system's implementation. Apply whenever writing Phase 4 tests.

---

## The Fundamental Rule

**Test what the user experiences, not what the code does.**

A parity test verifies that the new system produces the same outcome as the old system for the same input — from the user's perspective, not the implementation's perspective.

---

## Test Structure Rules

### Always reference the old system

✅ Do this — every parity test includes a source reference:
```typescript
// PARITY: OLD → src/controllers/auth.js:89-102
// Behaviour: Returns 401 with message "Invalid credentials" for wrong password.
// Does NOT distinguish between "email not found" and "wrong password" (intentional — security)
it('should return 401 for wrong password without revealing if email exists', async () => {
  const res = await request(app).post('/auth/login').send({ email: 'user@test.com', password: 'wrong' });
  expect(res.status).toBe(401);
  expect(res.body.message).toBe('Invalid credentials');
});
```

❌ Not this — no source, tests implementation detail:
```typescript
it('calls bcrypt.compare', async () => { ... });
```

### Tests must fail before implementation

Before writing implementation, run your tests. Every parity test must FAIL. A passing test before implementation means the test is wrong — it's testing a default or stub, not the real behaviour.

```bash
# Confirm all new parity tests fail
npm test -- tests/parity/ --no-coverage 2>&1 | grep -E "PASS|FAIL|✓|✗"
# Expected: all FAIL
```

### One describe per feature, multiple its per behaviour

```typescript
describe('User registration', () => {
  it('succeeds with valid email and password meeting requirements', ...)
  it('rejects email without @ symbol', ...)
  it('rejects password shorter than 8 characters', ...)
  it('rejects duplicate email with 409', ...)
  it('sends verification email on success', ...)
  it('does not create account if email send fails', ...) // transactional
});
```

---

## What to Test

Cover all four categories for every feature:

| Category | Example |
|----------|---------|
| Happy path | Valid inputs → expected success response |
| Validation failures | Each invalid input → specific error message |
| Business rule violations | Each business constraint → correct rejection |
| Edge cases | Empty string, null, max length, zero, negative |

---

## What NOT to Test

| Don't test | Why |
|-----------|-----|
| Internal function calls | Implementation detail — will change |
| Database structure directly | Tests the schema, not the behaviour |
| Code that was broken in the old system | Document in DEBT-REGISTER instead |
| Third-party service internals | Mock the boundary, not the service |

---

## Handling Old System Bugs

If the old system has a bug that users depend on:

```typescript
// PARITY: OLD → src/invoices.js:234
// KNOWN BUG in old system: VAT calculation is wrong for items over £1000
// Decision (2026-01-15): REPLICATE for data consistency — fix in Phase 5 enhancement
// DEBT-REGISTER: REPLICATE-001
it('calculates VAT using old (incorrect) formula for amounts over £1000', () => {
  // This is intentional — see DEBT-REGISTER REPLICATE-001
  ...
});
```

If the old system has a bug that should be FIXED:

```typescript
// OLD SYSTEM BEHAVIOUR: Returns 200 with empty array for invalid user (bug)
// NEW SYSTEM BEHAVIOUR: Returns 404 (correct)
// Decision (2026-01-15): FIX — documented in DEBT-REGISTER FIX-003
it('returns 404 for requests from non-existent user', () => {
  // This test defines the CORRECT new behaviour, not old behaviour
  ...
});
```

---

## Checklist — Before Submitting Parity Tests for Review

- [ ] Every feature in the inventory section has at least one test
- [ ] Every business rule has a test
- [ ] Every edge case from the inventory has a test
- [ ] Every test has an `// PARITY: OLD →` comment with file reference
- [ ] All tests confirmed FAILING before implementation
- [ ] PARITY-PLAN.md written with coverage table
- [ ] Decisions about bug replication vs fixing are documented
