# SKILL.md — Agent & Skill Creator

## Overview
Rules and templates for creating new agents and skills inside the starter kit. Apply this skill whenever writing `.claude/agents/*.md` or `.agents/skills/*/SKILL.md` files. This is the source of truth for format, size limits, and quality rules.

---

## The Difference Between Agents and Skills

| | Agent | Skill |
|---|---|---|
| **What it is** | A specialist that *executes* tasks | A rulebook that sets *standards* |
| **Where it lives** | `.claude/agents/{name}.md` | `.agents/skills/{name}/SKILL.md` |
| **How it's used** | Spawned by commands or orchestrators via `Task()` | Read by all agents at session start |
| **Size** | 300–1000 lines | 100–400 lines |
| **Contains** | Methodology, steps, output format | Rules, examples, checklists |

**Rule:** If you're describing *how to do a task*, it's an agent. If you're describing *how to do things correctly*, it's a skill.

---

## Agent Format Rules

### Required Sections (in this order)

```markdown
# {Name} Agent

> **Role color:** {color}
> **Spawned by:** {command or orchestrator name}
> **Output:** {exactly what files/actions this agent produces}

You are a **{name} agent**. {One sentence: role + why it matters.}

Your job: {Specific, concrete task description. No vague language.}

---

## CRITICAL: Mandatory Initial Read
[ALWAYS include this block — never omit it]

## Project Context Loading
[ALWAYS include the <project_context> block with skills loading]

## Input Context
[List exactly what files/data this agent expects]

## {Core Methodology — rename to match domain}
[Numbered steps. Each step has a clear action and output.]

## Output Format
[Exactly what the agent writes and where]

## Quality Rules
[Domain-specific rules. What does "done right" look like?]

## Size Constraints
[Table of max sizes for this agent's outputs]
```

### Mandatory Boilerplate (copy verbatim into every agent)

**Mandatory Initial Read block:**
```markdown
## CRITICAL: Mandatory Initial Read

If the prompt contains a `<files_to_read>` block, you **MUST** use the Read tool to load every file listed there before performing any other actions. This is your primary context.
```

**Project Context Loading block:**
```markdown
## Project Context Loading

<project_context>

**Project instructions:** Read `./CLAUDE.md` if it exists in the working directory. Follow all project-specific guidelines, security requirements, and coding conventions.

**Project skills:** Check `.agents/skills/` directory if it exists:

```bash
ls .agents/skills/ 2>/dev/null
```

If skills exist, read each `SKILL.md` to understand project-specific patterns, libraries, and conventions.

</project_context>
```

### Quality Rules for Agents

✅ Do this:
- Name the agent after its domain: `db-agent`, `auth-agent`, `payments-agent`
- Be specific about output paths: "Writes to `.planning/phases/{phase}/{phase}-PLAN.md`"
- Include real quality criteria: "Every migration must include a rollback method"
- Reference which skills the agent should apply

❌ Not this:
- Vague job descriptions: "helps with database stuff"
- Missing output format section
- No quality rules
- Omitting the mandatory boilerplate blocks (they MUST be present)

---

## Skill Format Rules

### Required Structure

```markdown
# SKILL.md — {Domain Name}

## Overview
{1–2 sentences: what this skill covers and when to apply it}

## {Section: Core Rules}

### {Rule Group}
{Concrete rules, not principles}

✅ Do this:
```code example```

❌ Not this:
```bad example```

## {Section: Patterns}

### {Pattern Name}
- When to use: {condition}
- How: {concrete steps}

## Project-Specific Conventions

### Stack Details
- {Library}: {version} — {key constraint}
- {Framework}: {version} — {key constraint}

### This Project's Specific Rules
- {Rule unique to this project}

## Checklist

Before completing any task in this domain:
- [ ] {Verifiable check}
- [ ] {Verifiable check}
- [ ] {Verifiable check}
```

### Quality Rules for Skills

✅ Do this:
- Write rules, not advice: "Always use `prisma.$transaction()`" not "consider using transactions"
- Include project-specific stack details with exact versions
- Add ✅ / ❌ code examples for every important rule
- End with a verifiable checklist

❌ Not this:
- Generic advice that applies to any project ("write clean code")
- Missing examples
- No checklist
- Exceeding 400 lines — split into sub-files if needed

---

## Naming Conventions

### Agents
- Use domain + `-agent` suffix: `db-agent`, `auth-agent`, `pdf-agent`
- Or task + `-er` suffix: `planner`, `executor`, `verifier`, `debugger`
- Kebab-case, lowercase

### Skills
- Use domain name only: `testing`, `security`, `api-design`, `redis-caching`
- No suffix
- Kebab-case, lowercase

---

## Size Limits

| Artifact | Min | Max | Why |
|----------|-----|-----|-----|
| Agent file | 300 lines | 1000 lines | Must be detailed enough to operate independently |
| Skill file | 100 lines | 400 lines | Read into every agent context — keep lean |
| Skill with sub-files | 200 lines (main) | unlimited (sub-files) | Main file is the table of contents |

---

## When to Create Sub-Files for Skills

If a skill covers multiple frameworks or platforms, split into sub-files:

```
.agents/skills/database/
├── SKILL.md          ← Overview + links to sub-files (under 200 lines)
├── postgresql.md     ← PostgreSQL-specific rules
├── redis.md          ← Redis-specific rules
└── migrations.md     ← Migration patterns
```

In SKILL.md, reference sub-files explicitly:
```markdown
## Database Backends

This project uses PostgreSQL (primary) and Redis (cache).

- PostgreSQL rules → read `postgresql.md`
- Redis rules → read `redis.md`
- Migration patterns → read `migrations.md`
```

---

## Checklist — Before Saving Any Agent or Skill

**For agents:**
- [ ] File is at `.claude/agents/{name}.md`
- [ ] Has role color, spawned-by, output in header block
- [ ] Mandatory Initial Read block is present (verbatim)
- [ ] Project Context Loading block is present (verbatim)
- [ ] Has Input Context, Core Methodology, Output Format, Quality Rules, Size Constraints sections
- [ ] Between 300–1000 lines
- [ ] CLAUDE.md updated to reference this agent

**For skills:**
- [ ] File is at `.agents/skills/{name}/SKILL.md`
- [ ] Has Overview section (1–2 sentences)
- [ ] Has at least one rule group with ✅ / ❌ examples
- [ ] Has Project-Specific Conventions section with stack versions
- [ ] Ends with a verifiable checklist
- [ ] Under 400 lines (or split into sub-files with SKILL.md as index)
- [ ] CLAUDE.md updated to reference this skill
