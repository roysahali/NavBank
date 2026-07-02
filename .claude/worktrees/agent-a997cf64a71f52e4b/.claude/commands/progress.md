---
name: progress
description: Show current project status and next steps
---

<objective>
Display current project state: what's done, what's in progress, and what's next.
</objective>

<execution>

## Check Project Exists
```bash
test -f .planning/PROJECT.md && echo "EXISTS" || echo "NOT_FOUND"
```

If NOT_FOUND:
```
No project initialized.
Run /new-project to get started.
```

## Load State

Read:
- `.planning/STATE.md`
- `.planning/ROADMAP.md`

## Display Status

```
═══════════════════════════════════════════
  PROJECT STATUS
═══════════════════════════════════════════

Milestone: {version}
Phase: {current phase number} / {total phases}

### Phases
  ✅ Phase 01: Foundation — complete
  ✅ Phase 02: Auth — complete
  🔄 Phase 03: Core Features — in progress
     Plan 03-01: ✅ complete
     Plan 03-02: 🔄 executing
     Plan 03-03: ⬜ not started
  ⬜ Phase 04: Integration — not started
  ⬜ Phase 05: Polish — not started

### Requirements
  Satisfied: 6/15
  In progress: 3/15
  Remaining: 6/15

### Next Step
  /execute-phase 3 (or /verify-work 3 if execution done)

### Session Info
  Context usage: ~{N}%
  Tip: /clear if context is above 50%
```
</execution>
