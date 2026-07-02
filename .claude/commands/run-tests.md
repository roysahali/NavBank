---
name: run-tests
description: Run full test suite, auto-fix failing tests by fixing source code, re-run until pass or escalate
argument-hint: "[phase_number] [--unit-only] [--e2e-only]"
---
<objective>
Spawn the test-agent to write missing tests and run the full suite. If tests fail: spawn fix-loop-agent to fix the SOURCE CODE (never the tests), re-run, iterate up to 3 times. Escalate failures that need human decision.
</objective>
<execution>

## Step 1: Spawn test-agent (first run)
```
Task("Run full test suite", {
  agent: "test-agent",
  prompt: `
    <files_to_read>
      .planning/REQUIREMENTS.md
      .planning/phases/{PHASE}/CONTEXT.md
    </files_to_read>
    Run the full test suite for phase {PHASE}.
    Flags: unit-only={UNIT_ONLY}, e2e-only={E2E_ONLY}
    Write results to .planning/phases/{PHASE}/TEST-RESULTS.md
    For each failing test, classify:
    - SOURCE-BUG: implementation is wrong (fix the source)
    - TEST-WRONG: test assertion is incorrect (rare — document why)
    - ENVIRONMENT: test infrastructure issue (flag for human)
  `
})
```

## Step 2: If FAIL — trigger fix loop
```bash
FAILING=$(grep -E "Failed: [^0]" .planning/phases/*/TEST-RESULTS.md 2>/dev/null | tail -1)
```

If failing tests found:
```
Task("Fix failing tests", {
  agent: "fix-loop-agent",
  prompt: `
    <files_to_read>
      .planning/phases/{PHASE}/TEST-RESULTS.md
      CLAUDE.md
    </files_to_read>

    Gate type: tests
    Phase: {PHASE}
    Max iterations: 3

    Fix loop — CRITICAL RULES:
    - NEVER modify a test to make it pass
    - NEVER delete a test to make it pass
    - NEVER use .skip() or .only() in committed test code
    - Fix the SOURCE CODE so the test passes
    - If a test reveals a genuine bug: fix the bug, not the test

    For each failing test:
    1. Read the test to understand what it expects
    2. Read the source code to understand what it does
    3. Identify the discrepancy
    4. Fix the source code
    5. Re-run that specific test to verify: npm test -- --testNamePattern="..."
    6. Only proceed to next failing test after this one passes

    After fixing: re-run full suite to ensure no regressions introduced.
    Write FIXED-ISSUES.md with each fix and verification.

    Escalate if:
    - Test reveals ambiguous business logic (human must decide expected behaviour)
    - Environment issue (database not running, config missing)
    - Flaky test (passes and fails intermittently)
  `
})
```

## Step 3: Re-run test suite
```
Task("Re-run tests post-fix", {
  agent: "test-agent",
  prompt: `Re-run full test suite. Update .planning/phases/{PHASE}/TEST-RESULTS.md.`
})
```

## Step 4: Report
```
If PASS:
  "✅ Tests PASSED — {N} tests, {coverage}% coverage"
  "Source fixes applied: {N}"
  "Next: /quality-gate"

If ESCALATED:
  "⚠️ {N} tests fixed. {N} require human decision:"
  "  - {test name}: {why ambiguous — what decision needed}"
  "Tests that remain failing block /create-pr."

If FLAKY DETECTED:
  "⚠️ Flaky tests detected (intermittent pass/fail):"
  "  - {test name}: passed {N}/3 runs"
  "Flaky tests must be fixed or deleted — they cannot be committed."
```
</execution>
