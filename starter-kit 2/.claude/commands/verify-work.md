---
name: verify-work
description: Manual verification (UAT) of phase work
argument-hint: "<phase_number>"
---

<objective>
Run user acceptance testing on a phase. Presents verification results, guides the user through checking key features, and creates UAT.md with findings. If gaps found, creates fix plans.
</objective>

<execution>

## Step 1: Load Verification Context

Read:
- `.planning/phases/{PHASE}-*/VERIFICATION.md` — Automated verification results
- `.planning/phases/{PHASE}-*/{PHASE}-*-SUMMARY.md` — Execution summaries
- `.planning/ROADMAP.md` — Phase goals

## Step 2: Present Verification Status

```
═══════════════════════════════════════════
  VERIFICATION: Phase {N}
═══════════════════════════════════════════

Automated verification: {passed/gaps_found}
Must-haves: {passed}/{total}

Let's walk through the key features together.
```

## Step 3: Guide User Through UAT

For each major feature in the phase:

```
═══════════════════════════════════════════
  CHECK {N}: {Feature Name}
═══════════════════════════════════════════

→ YOUR ACTION:
  1. Visit {URL} / Open {file} / Try {action}
  2. Verify: {specific thing to check}
  3. Expected: {what it should look like/do}

Does this work correctly? (yes / no / partial)
If not: What's wrong?
```

Ensure the environment is ready before each check (server running, database seeded, etc.).

## Step 4: Record UAT Results

Write `.planning/phases/{PHASE}-*/{PHASE}-UAT.md`:

```markdown
---
phase: "{phase}"
status: "passed"  # or "gaps_found"
checks_total: 5
checks_passed: 4
checks_failed: 1
---

# UAT: Phase {N}

## Results
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Registration form | ✅ | Works as expected |
| 2 | Login flow | ✅ | Correct redirect |
| 3 | Password reset | ✅ | Email received |
| 4 | Session persistence | ✅ | Survives refresh |
| 5 | Error messages | ❌ | Validation errors not showing on mobile |

## Gaps
### Gap 1: Mobile validation errors
- **Symptom:** Error messages hidden below fold on small screens
- **Expected:** Errors visible without scrolling
- **Severity:** Partial
```

## Step 5: Handle Gaps

If gaps found:
```
Gaps detected. Creating fix plans...
→ /plan-phase {N} --gaps
→ /execute-phase {N} --gaps-only
→ /verify-work {N}  (re-verify)
```

If all passed:
```
Phase {N} UAT passed ✅
Next: /discuss-phase {N+1}
Tip: /clear first.
```

## Step 6: Commit
```bash
git add .planning/phases/{PHASE}-*/{PHASE}-UAT.md
git commit -m "docs({PHASE}): user acceptance testing results"
```
</execution>
