---
name: debug
description: Start or resume a debug session
argument-hint: "[description or session slug]"
---

<objective>
Start a new debug session or resume an existing one. Spawns a debugger subagent with scientific debugging methodology.
</objective>

<execution>

## Check for Existing Sessions
```bash
ls .planning/debug/*.md 2>/dev/null
```

If sessions exist and no argument provided: List them and ask which to resume.
If argument matches an existing slug: Resume that session.
If argument is a new description: Start a new session.

## New Session

Spawn a **debugger agent**:

```
Task("Debug issue", {
  agent: "debugger",
  prompt: `
    Issue: {user's description}

    Read CLAUDE.md for project conventions.
    Create debug session file at .planning/debug/{slug}.md
    Start with symptom gathering, then investigate systematically.
  `
})
```

## Resume Session

```
Task("Resume debug session", {
  agent: "debugger",
  prompt: `
    <files_to_read>
      .planning/debug/{slug}.md
    </files_to_read>

    Resume this debug session. Read the file for full context.
  `
})
```

## Report

Display the debugger's findings:
- Root cause (if found)
- Fix applied (if applicable)
- Next steps (if unresolved)
</execution>
