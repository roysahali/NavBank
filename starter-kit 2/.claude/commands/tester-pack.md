---
name: tester-pack
description: Generate a complete, structured test case document for human testers — covering functional, negative, edge, accessibility, security, and regression cases
argument-hint: "[phase_number]"
---

<objective>
Read the feature specification and what was built, then generate a self-contained test case document (TESTER-PACK.md) that a human tester can execute without reading any other document. Replaces manual test case writing by QA.
</objective>

<when_to_run>
Run after /execute-phase and /verify-work, before handing off to QA.

```
/execute-phase N → /verify-work N → /tester-pack N → /run-pack N → human tester
```
</when_to_run>

<execution>

## Step 1: Determine phase
```bash
PHASE=${1:-$(grep "current_phase\|Phase:" .planning/STATE.md 2>/dev/null | head -1 | grep -oE '[0-9]+')}
echo "Generating test pack for phase: $PHASE"

# Check prerequisite — verify-work should have run
ls .planning/phases/*/VERIFICATION.md 2>/dev/null | tail -1 || \
  echo "Note: No VERIFICATION.md found — run /verify-work first for best results"
```

## Step 2: Spawn tester-pack-agent
```
Task("Generate test pack", {
  agent: "tester-pack-agent",
  prompt: `
    <files_to_read>
      CLAUDE.md
      .planning/REQUIREMENTS.md
      .planning/phases/{PHASE}/CONTEXT.md
      .planning/phases/{PHASE}/PLAN.md
      .planning/phases/{PHASE}/VERIFICATION.md
    </files_to_read>

    Generate a complete test pack for phase {PHASE}.

    1. Read REQUIREMENTS.md and CONTEXT.md — extract every testable acceptance criterion
    2. Read VERIFICATION.md — note what's already been technically verified (skip duplicating those)
    3. Inspect changed files to understand what was built: git diff HEAD~5 HEAD --name-only
    4. Detect app type from CLAUDE.md (web UI / API / CLI / mixed)
    5. Generate test cases across all categories:
       - Functional (happy path, core journeys)
       - Negative (invalid input, wrong permissions, missing data)
       - Edge cases (boundaries, empty states, max values, special chars)
       - Accessibility (WCAG 2.2 AA — keyboard, screen reader, contrast, labels)
       - Security (injection, auth boundaries, direct object access)
       - Regression (existing features that touch shared code)
    6. Mark screen reader / keyboard-only / UX judgment tests as NEEDS-HUMAN
    7. Write .planning/phases/{PHASE}-TESTER-PACK.md
    8. Include actual test credentials and setup steps in Preconditions
    9. Minimum 15 cases, maximum 60
  `
})
```

## Step 3: Report
```bash
PACK=".planning/phases/${PHASE}-TESTER-PACK.md"
TOTAL=$(grep -c "^#### TC-" "$PACK" 2>/dev/null || echo 0)
HUMAN=$(grep -c "NEEDS-HUMAN" "$PACK" 2>/dev/null || echo 0)
AUTO=$((TOTAL - HUMAN))

echo ""
echo "══════════════════════════════════════════"
echo "  TEST PACK GENERATED"
echo "══════════════════════════════════════════"
echo "  File:          $PACK"
echo "  Total cases:   $TOTAL"
echo "  Auto-runnable: $AUTO  (run /run-pack $PHASE to execute)"
echo "  Needs human:   $HUMAN  (screen reader, UX judgment, physical device)"
echo ""
echo "  Next steps:"
echo "  1. Run /run-pack $PHASE  →  executes $AUTO cases automatically"
echo "  2. Human tester handles $HUMAN NEEDS-HUMAN cases"
echo "  3. Share the pack: $PACK"
echo "══════════════════════════════════════════"
```

</execution>
