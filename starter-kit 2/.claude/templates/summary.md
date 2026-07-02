---
phase: "{phase-number}-{phase-name}"
plan: "{phase}-{plan-number}"
status: "complete"  # complete | partial | blocked
tasks_completed: 0
tasks_total: 0
requirements_addressed: []
files_changed: []
---

# Execution Summary: {Plan Objective}

## What Was Built
{Brief description of what was implemented}

## Task Results

### Task 1: {name} ✅
- **Files:** {list}
- **Verification:** {passed/failed — brief result}
- **Commit:** `{hash}` {message}

## Deviations
{Any deviations from the plan — what/why. "None" if plan followed exactly.}

## Decisions Made
{Any checkpoint:decision outcomes. "None" if no checkpoints.}

## Notes for Downstream Plans
{Anything the next plan, verifier, or future phases should know}
