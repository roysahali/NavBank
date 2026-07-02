---
name: remove-phase
description: Remove a phase from the roadmap and renumber subsequent phases
argument-hint: "<phase_number>"
---
<objective>
Remove the specified phase from the roadmap. Subsequent phases renumber down by 1.
</objective>
<execution>

## Step 1: Confirm phase exists and is safe to remove
```bash
PHASE=${1:?Phase number required. Usage: /remove-phase 3}
grep -A5 "Phase $PHASE" .planning/ROADMAP.md | head -6
```

"Confirm: remove Phase $PHASE from the roadmap? This cannot be undone. (yes to confirm)"

## Step 2: Remove and renumber
"Read .planning/ROADMAP.md. Remove Phase $PHASE entirely. Renumber all subsequent phases (-1). Update STATE.md."

## Step 3: Confirm
"Phase $PHASE removed. Roadmap renumbered."
</execution>
