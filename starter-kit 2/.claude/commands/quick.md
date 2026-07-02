---
name: quick
description: Quick mode for ad-hoc tasks — bug fixes, small features, config changes
argument-hint: "[description]"
---

<objective>
Execute a small, focused task without full phase planning. Creates a minimal plan, executes it, and commits. Use for bug fixes, small features, configuration changes, and one-off tasks.
</objective>

<execution>

## Step 1: Understand the Task

If no description provided, ask: "What do you want to do?"

## Step 2: Create Quick Plan

```bash
mkdir -p .planning/quick
```

Count existing quick plans:
```bash
NEXT=$(printf "%03d" $(( $(ls .planning/quick/ 2>/dev/null | wc -l) + 1 )))
SLUG=$(echo "{description}" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-' | head -c 40)
```

Create `.planning/quick/{NEXT}-{slug}/PLAN.md`:

```markdown
---
type: quick
objective: "{task description}"
files:
  - {affected files}
---

# Quick Task: {Description}

<task type="auto">
  <n>{task name}</n>
  <files>{files}</files>
  <action>
    {specific implementation steps}
  </action>
  <verify>
    {verification command}
  </verify>
  <done>{success criteria}</done>
</task>
```

## Step 3: Execute

Implement the task directly (no subagent needed for quick tasks unless complex).

Follow the plan's action steps, verify, and commit:

```bash
git add {files}
git commit -m "{type}: {description}"
```

## Step 4: Create Summary

Write `.planning/quick/{NEXT}-{slug}/SUMMARY.md`:

```markdown
---
type: quick
status: complete
---

# Quick Task: {Description}

## What Changed
{brief description}

## Files
{list of changed files}

## Verification
{result of verify step}
```

## Step 5: Report

```
Quick task complete ✅
Commit: {hash} {message}
Files: {list}
```
</execution>
