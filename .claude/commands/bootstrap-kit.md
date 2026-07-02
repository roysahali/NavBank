---
name: bootstrap-kit
description: Analyze project scope and auto-create all missing agents and skills for this project
argument-hint: "[--quick] [--agents-only] [--skills-only]"
---

<objective>
Scan the project scope, detect the tech stack and requirements, then spawn the kit-builder agent to create every agent and skill this project needs. Run this once at the start of a new project, or whenever you add a major new feature area.
</objective>

<pre_check>
Check what already exists:
```bash
echo "=== Agents ===" && ls .claude/agents/ 2>/dev/null || echo "(none)"
echo "=== Skills ===" && ls .agents/skills/ 2>/dev/null || echo "(none)"
echo "=== Planning ===" && test -f .planning/PROJECT.md && echo "PROJECT.md found" || echo "No .planning/ yet"
```

If `--quick` flag: Skip the gap report confirmation — just build and report when done.
If `--agents-only`: Only create agents, skip skill creation.
If `--skills-only`: Only create skills, skip agent creation.
</pre_check>

<execution>

## Step 1: Load Scope Context

Gather all available scope context:

```bash
# Project planning files
cat .planning/PROJECT.md 2>/dev/null
cat .planning/REQUIREMENTS.md 2>/dev/null
cat .planning/ROADMAP.md 2>/dev/null

# Tech stack signals
cat package.json 2>/dev/null | head -40
cat requirements.txt 2>/dev/null
cat pyproject.toml 2>/dev/null | head -20
cat go.mod 2>/dev/null | head -10
cat Cargo.toml 2>/dev/null | head -10
cat docker-compose.yml 2>/dev/null | head -30

# Existing source structure
find . -maxdepth 3 -name "*.ts" -o -name "*.py" -o -name "*.go" | grep -v node_modules | grep -v ".git" | head -20
```

## Step 2: Spawn Kit Builder Agent

```
Task("Build project-specific agents and skills", {
  agent: "kit-builder",
  prompt: `
    <files_to_read>
      .planning/PROJECT.md
      .planning/REQUIREMENTS.md
      .planning/ROADMAP.md
      CLAUDE.md
    </files_to_read>

    Analyze this project's scope and perform a full kit build:
    1. Read the project files above
    2. Detect the tech stack from any package/config files present
    3. Check what agents and skills already exist in .claude/agents/ and .agents/skills/
    4. Show the gap report and wait for confirmation (unless --quick flag was passed: {QUICK_FLAG})
    5. Create all missing agents and skills
    6. Update CLAUDE.md with references to new agents and skills
    7. Report what was created

    Flags in effect:
    - Quick mode (skip confirmation): {QUICK_FLAG}
    - Agents only: {AGENTS_ONLY_FLAG}
    - Skills only: {SKILLS_ONLY_FLAG}
  `
})
```

## Step 3: Commit New Kit Files

After the kit-builder agent completes:

```bash
git add .claude/agents/ .agents/skills/ CLAUDE.md
git commit -m "chore: bootstrap project kit — agents and skills for $(basename $(pwd))"
```

## Step 4: Report

Display final summary from the kit-builder agent, then show:

```
══════════════════════════════════════════
  BOOTSTRAP COMPLETE
══════════════════════════════════════════

Your starter kit is now tailored to this project.
All agents and skills are committed to git.

Useful commands now available:
  /create-agent <name>    Add another agent anytime
  /create-skill <name>    Add another skill anytime
  /help                   Full command reference

Next step:
  /new-project            (if not yet initialized)
  /discuss-phase 1        (if planning already done)
```

</execution>
