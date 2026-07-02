---
name: parity-check
description: Write parity tests for a feature group before implementation begins (Phase 4 gate)
argument-hint: "<feature-group> [phase-number]"
---

<objective>
Spawn the parity-test-agent to write failing parity tests from FEATURE-INVENTORY.md before any implementation code is written. This command is the gate before /execute-phase in Phase 4.
</objective>

<pre_check>
Verify the feature inventory exists:
```bash
test -f .planning/audit/FEATURE-INVENTORY.md && echo "EXISTS" || echo "MISSING"
```
If missing: "Run /audit-codebase first to produce the feature inventory."

Check if parity tests already exist for this group:
```bash
ls tests/parity/{FEATURE_GROUP}/ 2>/dev/null | head -5
```
If exists: ask "Parity tests for {feature-group} already exist. Overwrite or add to them?"
</pre_check>

<execution>

## Step 1: Parse arguments

- Feature group: first argument (e.g. "auth", "payments", "user-management")
- Phase: second argument or infer from STATE.md

## Step 2: Spawn parity-test-agent

```
Task("Write parity tests for {FEATURE_GROUP}", {
  agent: "parity-test-agent",
  prompt: `
    <files_to_read>
      .planning/audit/FEATURE-INVENTORY.md
    </files_to_read>

    Write parity tests for feature group: {FEATURE_GROUP}

    Steps:
    1. Read the {FEATURE_GROUP} section of FEATURE-INVENTORY.md
    2. If ../old-system exists, read relevant source files for behaviour details
    3. Write failing tests in tests/parity/{FEATURE_GROUP}/
    4. Run the tests to confirm they ALL fail (pre-implementation)
    5. Write .planning/phases/{PHASE}/PARITY-PLAN.md with coverage table

    The old system reference path: ../old-system (if it exists)
    Test framework: [read from CLAUDE.md]
  `
})
```

## Step 3: Confirm all tests fail

```bash
# Verify parity tests are failing (correct pre-implementation state)
npm test -- tests/parity/{FEATURE_GROUP}/ --no-coverage 2>&1 | tail -20
```

Report: "✅ {N} parity tests written and confirmed failing. Ready for /execute-phase."

## Step 4: Gate instruction

```
══════════════════════════════════════════
  PARITY TESTS READY
══════════════════════════════════════════

Tests: {N} written, all failing (correct)
Coverage: {N} features, {N} business rules, {N} edge cases

Next: /execute-phase {PHASE}

RULE: Implement until tests pass.
      DO NOT modify parity tests to make them pass.
      Fix the implementation, not the tests.
══════════════════════════════════════════
```

</execution>
