---
name: discuss-phase
description: Capture implementation decisions before planning a phase
argument-hint: "<phase_number>"
---

<objective>
Discuss a specific phase with the user to capture implementation preferences, architectural choices, and priorities before planning begins. Creates a CONTEXT.md with binding decisions.
</objective>

<execution>

## Step 1: Load Phase Context

Read:
- `.planning/ROADMAP.md` — Get this phase's goal and requirements
- `.planning/REQUIREMENTS.md` — Full requirement descriptions
- `.planning/PROJECT.md` — Project vision and constraints
- `.planning/STATE.md` — Current state

Extract the phase goal, assigned requirements, and dependencies.

## Step 2: Present Phase Overview

```
═══════════════════════════════════════════
  PHASE {N}: {Phase Name}
═══════════════════════════════════════════

Goal: {phase goal from roadmap}

Requirements:
  REQ-01: {description}
  REQ-02: {description}

Dependencies: {what prior phases produced}
```

## Step 3: Ask Implementation Questions

Based on the phase's requirements, ask focused questions about HOW the user wants things built. These typically cover:

- **UI preferences** — Layout approach, component library, design patterns
- **Technical choices** — Libraries, APIs, data shapes that affect implementation
- **Priority ordering** — Which requirement matters most within this phase
- **Edge cases** — How to handle specific scenarios
- **Quality tradeoffs** — Speed vs polish, simple vs comprehensive

Ask 3-5 questions. Don't overwhelm — focus on decisions that actually change the implementation.

## Step 4: Record Decisions

Present a summary for user confirmation:

```
Your decisions for Phase {N}:

1. {decision 1}
2. {decision 2}
3. {decision 3}

Does this capture your preferences correctly?
```

## Step 5: Create CONTEXT.md

Write `.planning/phases/{phase}-{name}/{phase}-CONTEXT.md`:

```markdown
---
phase: "{phase-number}-{phase-name}"
discussed: "{ISO date}"
---

# Phase {N} Context: {Name}

## Phase Goal
{goal from roadmap}

## Requirements
{list of REQ-IDs and descriptions for this phase}

## User Decisions

### Decision 1: {topic}
{what the user decided and why}

### Decision 2: {topic}
{what the user decided and why}

## Constraints
{any constraints from the discussion}

## Priority Order
{which requirements matter most}
```

## Step 6: Update STATE.md

Update current phase status:
```markdown
## Current
- **Phase:** {N} — discussed
- **Next step:** `/plan-phase {N}`
```

## Step 7: Commit

```bash
git add .planning/phases/{PHASE}-*/{PHASE}-CONTEXT.md .planning/STATE.md
git commit -m "docs({PHASE}): capture phase discussion decisions"
```

## Step 8: Report

```
Phase {N} discussion captured.
Next: /plan-phase {N}
Tip: /clear first for a fresh context window.
```
</execution>
