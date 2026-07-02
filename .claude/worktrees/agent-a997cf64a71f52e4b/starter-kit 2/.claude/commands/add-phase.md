---
name: add-phase
description: Append a new phase to the end of the current roadmap
argument-hint: "[phase_description]"
---
<objective>
Add a new phase to the roadmap after the last existing phase.
</objective>
<execution>

## Step 1: Read current roadmap
```bash
cat .planning/ROADMAP.md
LAST_PHASE=$(grep -oE "Phase [0-9]+" .planning/ROADMAP.md | tail -1 | grep -oE "[0-9]+")
NEXT=$((LAST_PHASE + 1))
echo "Last phase: $LAST_PHASE — adding Phase $NEXT"
```

## Step 2: Add new phase
"Read .planning/ROADMAP.md. Append Phase $NEXT with description: ${1:-new phase}. Keep the same format as existing phases."

## Step 3: Confirm
"Phase $NEXT added. Run /discuss-phase $NEXT when ready to begin it."
</execution>
