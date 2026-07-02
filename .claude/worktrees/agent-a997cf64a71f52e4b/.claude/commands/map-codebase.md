---
name: map-codebase
description: Analyze a codebase to understand architecture, patterns, stack, and conventions
argument-hint: "[--source <path>]  default: current directory"
---

<objective>
Analyze a codebase — current directory or an external path — to understand architecture, patterns, and tech stack. Used in midway projects (current dir) and re-architecture projects (external old system).
</objective>

<pre_check>
Determine the source:
- If `--source <path>` argument: map that external path
- If no argument: map the current directory (.)

```bash
SOURCE={ARG_PATH_OR_DOT}
test -d "$SOURCE" && echo "EXISTS" || echo "NOT FOUND: $SOURCE"
```
</pre_check>

<execution>

## Step 1: Set source path

If `--source` flag provided: SOURCE = the given path
Otherwise: SOURCE = current directory (.)

Announce: "Mapping codebase at: {SOURCE}"

## Step 2: Spawn codebase-mapper agent

```
Task("Map codebase at {SOURCE}", {
  agent: "codebase-mapper",
  prompt: `
    Analyze the codebase at: {SOURCE}

    {IF EXTERNAL PATH}
    This is a READ-ONLY reference codebase for a re-architecture project.
    NEVER modify it. NEVER commit to it.
    The goal is to understand what it does, not how — extract behaviour and architecture.
    {END IF}

    Create:
    - ARCHITECTURE.md — Architecture overview, patterns, conventions
    - STACK.md — Complete technology inventory with versions

    Save both files to: ./  (the current working directory, not {SOURCE})
  `
})
```

## Step 3: Commit

```bash
git add ARCHITECTURE.md STACK.md
git commit -m "docs: map codebase architecture${SOURCE != '.' ? ' at {SOURCE}' : ''}"
```

## Step 4: Report

```
Codebase mapped ✅  (source: {SOURCE})

Created:
  - ARCHITECTURE.md — Architecture and patterns
  - STACK.md — Technology inventory

Next steps:
  New project:        /new-project
  Re-architecture:    /audit-codebase {SOURCE}  (full feature extraction)
  Midway project:     Create or update CLAUDE.md from ARCHITECTURE.md
```

</execution>
