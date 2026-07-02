---
name: plan-phase
description: Research, create plans, and validate for a phase
argument-hint: "<phase_number> [--gaps]"
---

<objective>
Orchestrate the planning pipeline: research → plan creation → plan validation. Spawns specialized subagents for each step. Creates PLAN.md files ready for execution.
</objective>

<execution>

## Step 1: Load Context

Read:
- `.planning/ROADMAP.md` — Phase definition
- `.planning/REQUIREMENTS.md` — Requirements for this phase
- `.planning/phases/{PHASE}-*/CONTEXT.md` — User decisions

If `--gaps` flag: Also read `VERIFICATION.md` or `UAT.md` for gap descriptions.

## Step 2: Research (Optional)

Check if research is enabled for this project.

If yes, spawn a **researcher agent**:

```
Task("Research phase implementation", {
  agent: "researcher",
  prompt: `
    <files_to_read>
      .planning/ROADMAP.md
      .planning/REQUIREMENTS.md
      .planning/phases/{PHASE}-*/{PHASE}-CONTEXT.md
    </files_to_read>

    Research implementation approach for phase {N}: {phase name}.
    Focus on requirements: {REQ-IDs}
    User decisions: {summary of key decisions from CONTEXT.md}
  `
})
```

Wait for RESEARCH.md output.

## Step 3: Create Plans

Spawn a **planner agent**:

```
Task("Create phase plans", {
  agent: "planner",
  prompt: `
    <files_to_read>
      .planning/ROADMAP.md
      .planning/REQUIREMENTS.md
      .planning/phases/{PHASE}-*/{PHASE}-CONTEXT.md
      .planning/phases/{PHASE}-*/{PHASE}-RESEARCH.md  (if exists)
    </files_to_read>

    Create execution plans for phase {N}: {phase name}.
    {If --gaps: "Create gap closure plans for these gaps: {gap descriptions}"}
  `
})
```

Wait for PLAN.md files.

## Step 4: Validate Plans

Spawn a **plan-checker agent**:

```
Task("Validate phase plans", {
  agent: "plan-checker",
  prompt: `
    <files_to_read>
      .planning/ROADMAP.md
      .planning/REQUIREMENTS.md
      .planning/phases/{PHASE}-*/{PHASE}-*-PLAN.md
    </files_to_read>

    Check all plans for phase {N} across all quality dimensions.
  `
})
```

### If checker returns FAILED:
Send issues back to planner for revision:

```
Task("Revise plans based on checker feedback", {
  agent: "planner",
  prompt: `
    <files_to_read>
      .planning/phases/{PHASE}-*/{PHASE}-*-PLAN.md
    </files_to_read>

    Fix these issues:
    {checker issues}
  `
})
```

Re-run checker. Max 2 revision cycles.

### If checker returns PASSED:
Proceed to report.

## Step 5: Report

```
═══════════════════════════════════════════
  PLANNING COMPLETE: Phase {N}
═══════════════════════════════════════════

Plans: {N} plan(s) in {M} wave(s)

Wave 1: {plan-01}, {plan-02} (parallel)
Wave 2: {plan-03} (sequential, has checkpoint)

Requirements covered: {list}

Next: /execute-phase {N}
Tip: /clear first for a fresh context window.
```
</execution>
