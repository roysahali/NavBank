---
name: insert-phase
description: Insert a new phase at a specific position, renumbering subsequent phases
argument-hint: "<position>"
---
<objective>
Insert a new phase at the given position in the roadmap. All phases from that position onwards are renumbered.
</objective>
<execution>

## Step 1: Validate position
```bash
POS=${1:?Position required. Usage: /insert-phase 3}
echo "Inserting new phase at position $POS"
cat .planning/ROADMAP.md | grep "Phase " | head -20
```

## Step 2: Renumber and insert
"Read .planning/ROADMAP.md. Insert a new Phase $POS before the existing Phase $POS. Renumber all subsequent phases (+1). The new phase description should be: ${2:-to be defined}. Update STATE.md phase count."

## Step 3: Confirm
"Phase inserted at position $POS. Run /discuss-phase $POS to define it."
</execution>
