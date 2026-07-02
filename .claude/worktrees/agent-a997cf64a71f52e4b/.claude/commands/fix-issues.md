---
name: fix-issues
description: Read any gate report and automatically fix what can be fixed, escalate what cannot. Works on quality, security, test, and nfr reports.
argument-hint: "[gate-type: quality|security|tests|nfr|any] [phase_number]"
---

<objective>
Read the latest gate report for the specified gate type, spawn the fix-loop-agent to automatically fix every issue it can, re-run the gate to verify, and clearly report what was fixed vs what needs human attention.
</objective>

<execution>

## Step 1: Find the latest gate report

```bash
PHASE=${2:-$(cat .planning/STATE.md 2>/dev/null | grep "Phase:" | head -1 | awk '{print $2}')}
GATE=${1:-any}

case "$GATE" in
  quality) REPORT=$(ls .planning/phases/*/QUALITY.md 2>/dev/null | tail -1) ;;
  security) REPORT=$(ls .planning/phases/*/SECURITY.md 2>/dev/null | tail -1) ;;
  tests) REPORT=$(ls .planning/phases/*/TEST-RESULTS.md 2>/dev/null | tail -1) ;;
  nfr) REPORT=$(ls .planning/phases/*/NFR-RESULTS.md 2>/dev/null | tail -1) ;;
  any)
    # Find the most recently modified gate report
    REPORT=$(ls -t .planning/phases/*/{QUALITY,SECURITY,TEST-RESULTS,NFR-RESULTS}.md \
      2>/dev/null | head -1)
    ;;
esac

echo "Gate type: $GATE"
echo "Report: $REPORT"
[ -z "$REPORT" ] && echo "No gate report found. Run /quality-gate, /security-scan, or /run-tests first." && exit 1
```

## Step 2: Show current issue count

```bash
echo "=== Issues in report ==="
grep -E "FAIL|CRITICAL|HIGH|BLOCKER|violation|failed" "$REPORT" 2>/dev/null | head -20
```

## Step 3: Spawn fix-loop-agent

```
Task("Fix all issues in gate report", {
  agent: "fix-loop-agent",
  prompt: `
    <files_to_read>
      ${REPORT}
      CLAUDE.md
    </files_to_read>

    Read the gate report at: ${REPORT}
    Gate type: ${GATE}
    Phase: ${PHASE}
    Max iterations: 3

    Fix loop:
    1. Read every issue in the report
    2. Classify: auto-fixable / requires-code-change / requires-human
    3. Apply auto-fixes (ESLint --fix, npm audit fix, formatters)
    4. For each code issue: spawn executor in fix mode, verify fix worked
    5. Re-run the gate check after each iteration
    6. After max 3 iterations: write FIXED-ISSUES.md with:
       - What was fixed (with verification)
       - What could not be fixed and exactly why
       - Human action required for each remaining issue
  `
})
```

## Step 4: Re-run the original gate to confirm

```bash
case "$GATE" in
  quality) echo "Re-running: /quality-gate" ;;
  security) echo "Re-running: /security-scan" ;;
  tests) echo "Re-running: /run-tests" ;;
  nfr) echo "Re-running: /nfr-test" ;;
esac
```

## Step 5: Final report

Show FIXED-ISSUES.md summary and final gate status:

```
══════════════════════════════════════════
  FIX LOOP COMPLETE
══════════════════════════════════════════

Gate: {type}
Issues found:    {N}
Auto-fixed:      {N}  (formatters, dep patches)
Fixed by agent:  {N}  (code changes, verified)
Escalated:       {N}  (require human action)

Final gate status: PASS / PASS WITH WARNINGS / NEEDS HUMAN

{If escalated items exist:}
Human action required:
  1. {specific action} in {file}
  2. {specific action} in {file}
══════════════════════════════════════════
```

</execution>
