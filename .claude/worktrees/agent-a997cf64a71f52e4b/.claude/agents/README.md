# Claude Code Agents — Skills Samples

A collection of specialized agent prompts for multi-agent orchestration with Claude Code. Each agent is a self-contained expert designed to be spawned via the `Task()` tool with a fresh 200k token context window.

## Architecture

```
Commands (thin entry points)
    └── Workflows (orchestration logic, ~300 lines)
          └── Agents (domain specialists, ~800-1500 lines)
                └── Output: Structured markdown files in .planning/
```

**Key principle:** Orchestrators stay lean (10-15% context usage) by spawning specialized agents that do the heavy work in fresh contexts. Agents communicate through markdown files, never directly.

## Agent Roster

| Agent | File | Purpose | Spawned By |
|-------|------|---------|------------|
| **Planner** | `planner.md` | Creates executable PLAN.md files with task breakdown, dependency analysis, and wave assignments | Plan-phase workflow |
| **Plan Checker** | `plan-checker.md` | Validates plans across 6 dimensions before execution begins | Plan-phase workflow (after planner) |
| **Executor** | `executor.md` | Implements plans task-by-task with atomic commits and verification | Execute-phase workflow |
| **Verifier** | `verifier.md` | Goal-backward verification — checks actual code, not just summaries | Verify-work workflow |
| **Researcher** | `researcher.md` | Investigates implementation approaches with 4 research modes | Plan-phase or research-project workflow |
| **Research Synthesizer** | `research-synthesizer.md` | Combines parallel research tracks into unified findings | Research-project workflow |
| **Debugger** | `debugger.md` | Scientific debugging with hypothesis testing and session persistence | Debug workflow |
| **Codebase Mapper** | `codebase-mapper.md` | Analyzes brownfield codebases for architecture and patterns | Map-codebase workflow |
| **Roadmapper** | `roadmapper.md` | Creates phase-based roadmaps from requirements | New-project or new-milestone workflow |
| **Kit Builder** | `kit-builder.md` | Analyzes project scope and creates missing agents + skills | bootstrap-kit command, or on-demand |

## Development Lifecycle

```
New Project → Research → Requirements → Roadmap
                                          │
         ┌────────────────────────────────┘
         ▼
    Discuss Phase → Plan Phase → Execute Phase → Verify Work
         │              │              │              │
         │         ┌────┴────┐    ┌────┴────┐    ┌───┴────┐
         │         │Researcher│    │Executor │    │Verifier│
         │         │Planner   │    │Executor │    └────────┘
         │         │Checker   │    │Executor │
         │         └──────────┘    └─────────┘
         │
    (repeat for each phase)
         │
    Audit Milestone → Complete Milestone → Next Milestone
```

## Project State Directory

All agents read from and write to the `.planning/` directory:

```
.planning/
├── PROJECT.md              # Vision, goals, constraints (living document)
├── REQUIREMENTS.md         # REQ-IDs with phase mappings and status
├── ROADMAP.md              # Phase definitions and progress
├── STATE.md                # Current state, decisions, session history
├── config.json             # Settings and preferences
├── research/               # Project-level research output
├── phases/
│   ├── 01-foundation/
│   │   ├── 01-CONTEXT.md       # User decisions from discuss-phase
│   │   ├── 01-RESEARCH.md      # Phase-specific research
│   │   ├── 01-01-PLAN.md       # Execution plan (wave 1)
│   │   ├── 01-01-SUMMARY.md    # Execution results
│   │   ├── 01-02-PLAN.md       # Execution plan (wave 1)
│   │   ├── 01-02-SUMMARY.md    # Execution results
│   │   └── 01-VERIFICATION.md  # Goal-backward verification
│   └── 02-auth/
│       └── ...
├── debug/                  # Debug session files
└── milestones/             # Archived milestone artifacts
```

## How to Use

### 1. Install agents in your Claude Code config

Copy the agent files to `~/.claude/agents/` (global) or `.claude/agents/` (project-local).

### 2. Reference in your workflows

Workflows spawn agents using `Task()`:

```
Task("Implement the plan", {
  agent: "planner",
  prompt: `
    <files_to_read>
      .planning/ROADMAP.md
      .planning/REQUIREMENTS.md
      .planning/phases/01-foundation/01-CONTEXT.md
    </files_to_read>

    Create plans for phase 01-foundation.
  `
})
```

### 3. Customize for your project

Each agent follows project conventions by reading:
- `./CLAUDE.md` — Project-specific instructions
- `.agents/skills/` — Project-specific skill files

Add your own conventions, and agents will follow them.

## Design Principles

1. **Plans are prompts** — PLAN.md files are written for executor agents to interpret, not humans to read
2. **Atomic commits** — Every task produces exactly one git commit
3. **Goal-backward verification** — Verify outcomes, not just task completion
4. **Fresh contexts** — Each agent spawns with a clean 200k token window
5. **File-based communication** — Agents communicate through structured markdown, never directly
6. **Automation-first** — If it can be done via CLI/API, the agent does it — never asks the user

## Size Constraints

| Artifact | Max size | Reason |
|----------|----------|--------|
| PLAN.md | 600 lines | Fits in executor context |
| Tasks per plan | 8 | Quality degrades beyond this |
| Files per task | 6 | Scope creep signal |
| Plans per phase | 6 | Phase too large — split it |
| SUMMARY.md | 400 lines | Keep summaries focused |
| RESEARCH.md | 800 lines | Bounded research output |

## License

These agent prompts are provided as samples. Adapt freely for your projects.
