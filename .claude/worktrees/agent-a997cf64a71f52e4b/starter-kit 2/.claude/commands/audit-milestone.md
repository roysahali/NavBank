---
name: audit-milestone
description: Verify all milestone requirements are met before completion
---

<objective>
Audit the entire milestone by cross-referencing requirements, verification reports, and summaries. Detects gaps, stubs, and incomplete work across all phases.
</objective>

<execution>

## Step 1: Load All Phase Results

```bash
# Find all verification and summary files
find .planning/phases/ -name "VERIFICATION.md" -o -name "*-SUMMARY.md" | sort
```

Read:
- `.planning/REQUIREMENTS.md` — All v1 requirements
- `.planning/ROADMAP.md` — Phase status
- All `VERIFICATION.md` files — Phase verification results
- All `SUMMARY.md` files (frontmatter only) — Execution status

## Step 2: Cross-Reference

For each v1 requirement:
1. Find which phase it's assigned to
2. Check VERIFICATION.md for that phase — is the requirement satisfied?
3. Check SUMMARY.md frontmatter — was it addressed?
4. Flag any mismatches

## Step 3: Detect Stubs

```bash
grep -rn "TODO\|FIXME\|STUB\|NOT_IMPLEMENTED\|PLACEHOLDER" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

## Step 4: Run Tests

```bash
npm test 2>&1 | tail -20
```

## Step 5: Create Audit Report

Write `.planning/MILESTONE-AUDIT.md`:

```markdown
# Milestone Audit: v{version}

## Summary
{overall assessment}

## Requirement Status
| REQ-ID | Description | Phase | Verified | Evidence |
|--------|-------------|-------|----------|----------|
| REQ-01 | ... | 01 | ✅ | VERIFICATION.md |
| REQ-02 | ... | 02 | ❌ | Gap in Phase 02 |

## Test Results
{pass/fail summary}

## Stubs/TODOs Found
{list if any}

## Verdict
{READY FOR COMPLETION | GAPS REMAIN}
```

If gaps remain: Suggest `/plan-phase {N} --gaps` for each affected phase.
If ready: Suggest `/complete-milestone`.
</execution>
