---
name: create-agent
description: Create a new specialized agent for a specific domain or task
argument-hint: "<agent-name> [description]"
---

<objective>
Instantly create a single new agent tailored to a specific domain, service, or task. Use this anytime during development when you realize you need a specialist that doesn't exist yet.
</objective>

<execution>

## Step 1: Parse the Request

Extract from the command arguments or the conversation:
- **Agent name** — e.g. `twilio-agent`, `pdf-generator`, `cache-manager`
- **Domain description** — What this agent specializes in (infer from name if not provided)

If neither is clear, ask:
> "What should this agent do? Give me the name and one sentence describing its job."

## Step 2: Load Current Project Context

```bash
cat CLAUDE.md 2>/dev/null | head -50
ls .claude/agents/
ls .agents/skills/ 2>/dev/null
```

## Step 3: Spawn Kit Builder (Single Agent Mode)

```
Task("Create new agent: {agent-name}", {
  agent: "kit-builder",
  prompt: `
    Create a single new agent for this project. Do NOT run the full gap analysis.
    Go directly to building.

    Agent to create: {agent-name}
    Domain: {description or inferred from name}

    Steps:
    1. Read CLAUDE.md for project tech stack context
    2. Check .agents/skills/ for any relevant skills this agent should reference
    3. Write .claude/agents/{agent-name}.md following the exact agent format
    4. Add this agent to CLAUDE.md under the agents section
    5. Report: show the created file path and a 2-line summary of what it does

    Do not create any skills. Do not run the gap analysis. Just create this one agent.
  `
})
```

## Step 4: Confirm and Commit

```bash
git add .claude/agents/{agent-name}.md CLAUDE.md
git commit -m "feat: add {agent-name} to project kit"
```

Show the user:
```
✅ Created: .claude/agents/{agent-name}.md
✅ Updated: CLAUDE.md

You can now use this agent by saying:
  "Use the {agent-name} for [task]"
  or spawn it in a workflow with Task("...", { agent: "{agent-name}" })
```

</execution>
