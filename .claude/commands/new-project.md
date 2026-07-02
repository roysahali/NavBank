---
name: new-project
description: Initialize a new project with questions, research, requirements, and roadmap
argument-hint: "[--auto @prd.md]"
---

<objective>
Initialize a new project by gathering requirements, optionally running research, and creating a phased roadmap. Creates the `.planning/` directory with all project state files.
</objective>

<pre_check>
Check if `.planning/PROJECT.md` already exists:
```bash
test -f .planning/PROJECT.md && echo "EXISTS" || echo "NOT_FOUND"
```
If EXISTS: Stop and inform user — project already initialized. Delete `.planning/` to start over.

Check if this is a brownfield project:
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" -o -name "*.go" \) | grep -v node_modules | head -5
```
If source files exist and no ARCHITECTURE.md: Suggest running `/map-codebase` first.
</pre_check>

<execution>

## Step 1: Initialize Git (if needed)
```bash
test -d .git || git init
```

## Step 2: Create .planning directory
```bash
mkdir -p .planning/research .planning/phases .planning/debug
```

## Step 3: Ask Questions

Ask the user these essential questions (wait for all answers before proceeding):

1. **What are you building?** — Describe the project in 1-2 sentences
2. **What's the #1 priority?** — The one thing that must work perfectly
3. **What's out of scope?** — Things you explicitly don't want to build
4. **Any constraints?** — Tech preferences, hosting, budget, timeline, existing tools

## Step 4: Create PROJECT.md

Write `.planning/PROJECT.md` with the user's answers:

```markdown
# Project: {name}

## Vision
{what they're building}

## Core Priority
{the #1 thing}

## Boundaries
{what's out of scope}

## Constraints
{tech, hosting, budget, timeline}
```

## Step 5: Research (Optional)

Ask: "Should I research the domain before creating requirements? Recommended for unfamiliar territory."

If yes → Spawn researcher agents (parallel):
- Stack research
- Feature research
- Architecture research
- Risk research

Then spawn research-synthesizer to merge findings.

## Step 6: Create REQUIREMENTS.md

Extract requirements from the conversation and research. Assign IDs:

```markdown
# Requirements

## v1 (This Milestone)
- REQ-01: {requirement}
- REQ-02: {requirement}

## v2 (Future)
- REQ-20: {deferred requirement}

## Out of Scope
- {explicitly excluded}
```

## Step 7: Create Roadmap

Spawn the roadmapper agent with PROJECT.md, REQUIREMENTS.md, and research.

## Step 8: Create STATE.md

```markdown
# Project State

## Current
- **Phase:** Not started
- **Milestone:** v1.0

## Next Step
Run `/discuss-phase 1` to begin the first phase.
```

## Step 9: Commit

```bash
git add .planning/
git commit -m "docs: initialize project planning"
```

## Step 10: Report

Display:
- Project summary
- Number of requirements (v1 / v2 / out of scope)
- Roadmap overview (phase names)
- Next step: `/discuss-phase 1`
</execution>
