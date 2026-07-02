---
name: execute-phase
description: Execute all plans for a phase using parallel subagents
argument-hint: "<phase_number> [--gaps-only]"
---

<objective>
Execute all plans for a phase by spawning executor subagents. Plans in the same wave run in parallel. Each executor commits atomically and produces a SUMMARY.md. After execution, runs automatic verification.
</objective>

<execution>

## Step 1: Load Plans

Read all PLAN.md files for this phase:
```bash
ls .planning/phases/{PHASE}-*/{PHASE}-*-PLAN.md
```

If `--gaps-only`: Only execute plans created by gap closure (typically the highest-numbered plans).

Parse each plan's frontmatter to extract:
- `wave` — Execution order
- `autonomous` — Whether it has checkpoints
- `plan` — Plan identifier

Group plans by wave.

## Step 2: Execute Wave by Wave

For each wave (1, 2, 3...):

### Spawn executors in parallel

For autonomous plans in the same wave, spawn ALL at once:

```
// Wave 1: spawn all simultaneously
Task("Execute plan 01-01", {
  agent: "executor",
  prompt: `
    <files_to_read>
      .planning/phases/{PHASE}-*/{PHASE}-01-PLAN.md
    </files_to_read>

    Execute this plan. Follow every task exactly.
    Read CLAUDE.md and .agents/skills/ for project conventions.
  `
})

Task("Execute plan 01-02", {
  agent: "executor",
  prompt: `
    <files_to_read>
      .planning/phases/{PHASE}-*/{PHASE}-02-PLAN.md
    </files_to_read>

    Execute this plan. Follow every task exactly.
    Read CLAUDE.md and .agents/skills/ for project conventions.
  `
})
```

For non-autonomous plans (with checkpoints): Execute one at a time so checkpoints can be presented.

### Wait for wave completion

All executors in a wave must complete before moving to the next wave.

### Spot-check results

Read the first 2-3 lines of each SUMMARY.md to check status:
```bash
head -10 .planning/phases/{PHASE}-*/{PHASE}-*-SUMMARY.md
```

If any executor reported `blocked`: Note for the final report.

## Step 3: Update State

After all waves complete:

Update ROADMAP.md — check off completed plans:
```markdown
- [x] 01-01-PLAN.md — {objective}
- [x] 01-02-PLAN.md — {objective}
```

Update STATE.md with execution results.

## Step 4: Auto-Verify

Spawn a **verifier agent** to check the work:

```
Task("Verify phase work", {
  agent: "verifier",
  prompt: `
    <files_to_read>
      .planning/ROADMAP.md
      .planning/REQUIREMENTS.md
      .planning/phases/{PHASE}-*/{PHASE}-*-PLAN.md
      .planning/phases/{PHASE}-*/{PHASE}-*-SUMMARY.md
    </files_to_read>

    Verify phase {N} goals are met by inspecting actual code and running tests.
  `
})
```

## Step 5: Handle Verification Results

### If PASSED:
```
═══════════════════════════════════════════
  PHASE {N} COMPLETE ✅
═══════════════════════════════════════════

All must-haves verified.
Requirements satisfied: {list}

Next: /discuss-phase {N+1}
```

### If GAPS FOUND:
```
═══════════════════════════════════════════
  PHASE {N}: GAPS FOUND
═══════════════════════════════════════════

{N} gaps detected.

Options:
A) /plan-phase {N} --gaps  → Create fix plans and re-execute
B) /verify-work {N}        → Manual verification (UAT)
```

## Step 6: Report

Display:
- Plans executed: {count}
- Tasks completed: {count}
- Commits made: {list}
- Verification status
- Any blockers or issues
- Next step
</execution>
