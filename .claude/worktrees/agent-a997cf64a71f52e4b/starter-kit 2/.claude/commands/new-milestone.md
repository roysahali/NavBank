---
name: new-milestone
description: Start the next milestone — reset roadmap and planning for the next version
argument-hint: "[milestone_name]"
---
<objective>
Archive the current milestone and initialise planning for the next one.
</objective>
<execution>

## Step 1: Confirm current milestone is complete
```bash
cat .planning/STATE.md | grep "Milestone"
```
If not complete: "Run /audit-milestone and /complete-milestone first."

## Step 2: Create next milestone planning
```bash
NEXT=${1:-"v2.0"}
mkdir -p ".planning/milestones/$NEXT"
cp .planning/REQUIREMENTS.md ".planning/milestones/$NEXT/REQUIREMENTS-v1.md" 2>/dev/null || true
echo "Milestone: $NEXT\nStarted: $(date)\nStatus: Planning" > .planning/STATE.md
```

## Step 3: Create new roadmap
"Read .planning/REQUIREMENTS.md and create an updated ROADMAP.md for $NEXT incorporating any new requirements and lessons learned from the previous milestone."

## Step 4: Report
"Milestone $NEXT initialised. Update .planning/REQUIREMENTS.md with new requirements, then run /discuss-phase 1 to begin."
</execution>
