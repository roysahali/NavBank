---
name: nfr-test
description: Load, stress, accessibility and reliability testing. Auto-fix accessibility violations. Escalate performance and load findings.
argument-hint: "[phase_number]"
---
<objective>
Spawn the nfr-test-agent to run non-functional tests. Accessibility violations are auto-fixed by the fix-loop-agent. Performance and load failures are escalated with clear root-cause analysis and fix recommendations.
</objective>
<execution>

## Step 1: Spawn nfr-test-agent
```
Task("Run NFR tests", {
  agent: "nfr-test-agent",
  prompt: `
    Run full NFR test suite for phase {PHASE}.
    Write report to .planning/phases/{PHASE}/NFR-RESULTS.md
    Classify each finding:
    - A11Y-AUTO-FIX: missing ARIA, missing alt text, wrong heading level
    - A11Y-MANUAL: keyboard flow, screen reader order, complex interaction
    - PERFORMANCE-CODE: N+1, missing index, slow algorithm
    - PERFORMANCE-CONFIG: missing cache, wrong connection pool size
    - LOAD-CAPACITY: system needs more resources (infrastructure decision)
    - RELIABILITY: flapping health check, memory leak pattern
  `
})
```

## Step 2: Auto-fix accessibility violations
```bash
A11Y_ISSUES=$(grep -c "A11Y-AUTO-FIX\|critical\|serious" \
  .planning/phases/*/NFR-RESULTS.md 2>/dev/null || echo 0)
```

If A11Y_ISSUES > 0:
```
Task("Fix accessibility violations", {
  agent: "fix-loop-agent",
  prompt: `
    <files_to_read>
      .planning/phases/{PHASE}/NFR-RESULTS.md
      CLAUDE.md
    </files_to_read>

    Gate type: nfr
    Phase: {PHASE}
    Max iterations: 3

    Fix accessibility violations only (not performance — that needs different approach).

    For each AUTO-FIX accessibility violation:
    1. Missing alt text: add descriptive alt="" to <img> elements
    2. Missing aria-label: add aria-label to interactive elements without visible text
    3. Wrong heading hierarchy: fix h1→h2→h3 order
    4. Missing form labels: add <label for=""> or aria-labelledby
    5. Low contrast: update colour values to meet 4.5:1 ratio
    6. Missing focus indicator: add :focus styles with visible outline
    7. After each fix: run axe-core on affected component to verify

    See accessibility skill for all WCAG 2.1 AA patterns.
    Write FIXED-ISSUES.md.

    Escalate:
    - Screen reader flow issues (need manual testing with NVDA/VoiceOver)
    - Complex keyboard interaction patterns
    - Performance/load issues (different agents handle those)
  `
})
```

## Step 3: Performance findings — spawn performance-agent for root cause
```bash
PERF_ISSUES=$(grep -c "PERFORMANCE-CODE\|N+1\|missing index" \
  .planning/phases/*/NFR-RESULTS.md 2>/dev/null || echo 0)
```

If PERF_ISSUES > 0:
```
Task("Fix performance code issues", {
  agent: "performance-agent",
  prompt: `
    Read .planning/phases/{PHASE}/NFR-RESULTS.md.
    For each PERFORMANCE-CODE issue:
    1. N+1 queries: refactor to batch loading
    2. Missing indexes: add CREATE INDEX statements
    3. Missing pagination: add LIMIT/OFFSET to list queries
    4. Missing caching: add cache layer at appropriate point
    Apply fixes directly to source code.
    Re-measure the specific endpoint after each fix.
  `
})
```

## Step 4: Re-run NFR tests
```
Task("Re-run NFR tests post-fix", {
  agent: "nfr-test-agent",
  prompt: `Re-run NFR tests. Update .planning/phases/{PHASE}/NFR-RESULTS.md.`
})
```

## Step 5: Report
```
If PASS:
  "✅ NFR tests PASSED"
  "Accessibility fixes: {N} (auto-fixed)"
  "Performance fixes: {N} (code changes)"
  "Next: /create-pr"

If ESCALATED:
  "⚠️ NFR tests: {N} auto-fixed. Human action needed:"
  "  MANUAL A11Y: {N} issues need screen reader/keyboard testing"
  "  LOAD CAPACITY: System needs infrastructure scaling (not a code fix)"
  "    - Current: p95={N}ms at {N} users"
  "    - Target: p95<500ms at {N} users"
  "    - Recommendation: {specific infra change}"
```
</execution>
