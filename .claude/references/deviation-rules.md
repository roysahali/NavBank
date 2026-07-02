# Deviation Rules

## When Plans Meet Reality

Plans are written before execution. Reality sometimes differs. These rules govern what executors can change independently vs. what requires escalation.

---

## Deviation Severity Levels

### Minor — Handle Yourself
Changes that don't affect the plan's intent or outcome.

**Examples:**
- Import path slightly different than expected
- Need to install a dependency mentioned in the action
- File exists and needs updating instead of creating from scratch
- Small type errors that need fixing
- Adjusting test assertions to match actual (correct) output
- Adding a missing `await`

**Action:** Fix it, note it briefly in SUMMARY.md, continue.

### Medium — Document and Continue
Changes that modify HOW something is done but preserve WHAT is done.

**Examples:**
- A library API changed since the plan was written
- An existing file has a different structure than expected
- Need to add a database migration the plan didn't mention
- Test setup needs adjustment for the actual environment
- A utility function needs a slightly different signature

**Action:** Make the minimum change needed, document what and why in SUMMARY.md, continue.

### Major — Stop and Report
Changes that affect the plan's intent, architecture, or scope.

**Examples:**
- The planned approach is fundamentally flawed
- A required service/API doesn't exist or works completely differently
- Implementation would break existing functionality that must be preserved
- Security concern with the planned approach
- Need to change the database schema in ways that affect other phases
- Scope is significantly larger than the plan estimated

**Action:** Stop execution, document the blocker in SUMMARY.md, report to orchestrator. Do NOT attempt a fix.

---

## Decision Framework

```
Can I fix this in < 5 minutes without changing the plan's outcome?
├─ YES → Minor deviation. Fix and note.
└─ NO ↓

Does the fix change HOW but not WHAT?
├─ YES → Medium deviation. Document and continue.
└─ NO ↓

Does this change the plan's intent, scope, or architecture?
├─ YES → Major deviation. STOP and report.
└─ NO → Re-evaluate. When in doubt, treat as medium.
```

---

## What Executors CANNOT Change

These are locked decisions — deviating requires going back to the user:

- **Library choices** — If the plan says "use bcrypt", don't switch to argon2
- **API contracts** — Routes, request/response shapes are binding
- **Database schema** — Column names, types, relations are binding
- **Architecture patterns** — Server vs client rendering, auth strategy, etc.
- **User decisions** — Anything from CONTEXT.md is non-negotiable

## What Executors CAN Change

These are implementation details within the plan's intent:

- Variable and function names (unless specified in plan)
- Internal code organization within a file
- Additional error handling beyond what's specified
- Minor performance optimizations that don't change behavior
- Import order, formatting, whitespace
- Adding helpful code comments
