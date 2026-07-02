---
name: create-skill
description: Create a new skill (coding standards/patterns) for a specific domain
argument-hint: "<skill-name> [description]"
---

<objective>
Instantly create a new SKILL.md for a specific domain, library, or convention. Use this when you establish new patterns during development that all agents should follow consistently.
</objective>

<execution>

## Step 1: Parse the Request

Extract from the command arguments or conversation:
- **Skill name** — e.g. `redis-caching`, `typescript-style`, `stripe-errors`
- **Domain description** — What standards this skill defines (infer from name if not given)

If unclear, ask:
> "What conventions or rules should this skill capture? What domain does it cover?"

## Step 2: Load Relevant Context

```bash
cat CLAUDE.md 2>/dev/null | head -60
ls .agents/skills/
# If relevant source files exist, scan them for existing patterns
find . -name "*.ts" -o -name "*.py" | grep -v node_modules | head -10
```

## Step 3: Spawn Kit Builder (Single Skill Mode)

```
Task("Create new skill: {skill-name}", {
  agent: "kit-builder",
  prompt: `
    Create a single new skill for this project. Do NOT run the full gap analysis.
    Go directly to building.

    Skill to create: {skill-name}
    Domain: {description or inferred from name}

    Steps:
    1. Read CLAUDE.md for project tech stack and any existing conventions
    2. Scan relevant source files to infer current patterns (if source exists)
    3. Create the directory: .agents/skills/{skill-name}/
    4. Write .agents/skills/{skill-name}/SKILL.md following the exact skill format:
       - Rules with ✅ / ❌ examples
       - Project-specific stack details (exact versions, libraries)
       - End with a checklist
    5. Add reference to this skill in CLAUDE.md under the skills section
    6. Report: show the file path and a 2-line summary of what it covers

    Do not create any agents. Do not run the gap analysis. Just create this one skill.
  `
})
```

## Step 4: Confirm and Commit

```bash
git add .agents/skills/{skill-name}/ CLAUDE.md
git commit -m "docs: add {skill-name} skill to project kit"
```

Show the user:
```
✅ Created: .agents/skills/{skill-name}/SKILL.md
✅ Updated: CLAUDE.md

All agents will now automatically load this skill
at the start of each session via their context block.

To invoke this skill explicitly, say:
  "Apply the {skill-name} skill to this code"
```

</execution>
