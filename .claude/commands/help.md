---
name: help
description: Show all available commands with descriptions and the recommended workflow
---

## Setup — run once per project, in order

| Command | What it does |
|---------|-------------|
| `/init [doc] [--rearchitect path]` | START HERE — reads scope doc or old codebase, creates CLAUDE.md |
| `/new-project` | Step 2 — creates .planning/ with requirements and roadmap |
| `/bootstrap-kit` | Step 3 — detects stack, creates project-specific agents + skills |
| `/map-codebase [--source path]` | Map architecture of current or external codebase |
| `/audit-codebase <path>` | Re-arch Phase 1 — extract features, data model, integrations, debt |

---

## Phase workflow — repeat for every phase

| Command | What it does |
|---------|-------------|
| `/discuss-phase N` | Capture implementation decisions before any code is written |
| `/plan-phase N` | Research → create PLAN.md files → validate with plan-checker |
| `/execute-phase N` | Implement all tasks in the plan with atomic git commits |
| `/verify-work N` | Goal-backward verification of phase outcomes after merge |
| `/parity-check <group>` | Re-arch only — write parity tests from inventory before Phase 4 |

---

## Quality gates — run after /execute-phase, before /create-pr

Run in this order:

```
/run-tests → /test-integrations → /quality-gate → /security-scan → /nfr-test
```

| Command | What it checks |
|---------|--------------|
| `/run-tests` | Full test suite — unit, integration, e2e. Auto-fixes source on failure. |
| `/test-integrations` | Real system connections — Pact contracts, queues, health checks |
| `/quality-gate` | Stack-detected static analysis — CodeQL, ESLint/Ruff/golangci-lint. SonarQube optional. Auto-fixes violations. |
| `/security-scan` | OWASP, CVE, secrets, SAST. Auto-patches deps. |
| `/nfr-test` | Load, stress, WCAG 2.2 AA accessibility. Auto-fixes a11y violations. |

Every gate includes a **fix loop**: find → fix → re-run → pass or escalate. Max 3 iterations.

---

## QA handoff — test case generation and execution

Run after /verify-work, before handing to QA team.

```
/execute-phase N  →  /verify-work N  →  /tester-pack N  →  /run-pack N  →  human tester
```

| Command | What it does |
|---------|-------------|
| `/tester-pack [N]` | Reads spec + what was built → generates TESTER-PACK.md with 15–60 structured test cases covering functional, negative, edge, accessibility, security, and regression scenarios |
| `/run-pack [N]` | Executes all auto-runnable cases in TESTER-PACK.md using Playwright/curl/shell → marks each PASS, FAIL, or NEEDS-HUMAN. Never modifies expected results. |

**What /run-pack auto-executes:** API calls, UI flows (Playwright), CLI commands, form validation, auth boundary checks, SQL injection attempts, response time checks.

**What is always NEEDS-HUMAN:** screen reader testing, keyboard-only flows, physical device testing, UX judgment ("does this feel right?"), exploratory testing.

**Honest outcome:** /run-pack replaces ~70–80% of manual functional testing. Human testers handle the NEEDS-HUMAN items only — they execute, not design, the test plan.

---

## Extended testing — run on schedule, not per PR

| Command | Cadence | What it does |
|---------|---------|-------------|
| `/smoke-test [url]` | After every deploy | 2-min health check — rollback trigger if fails |
| `/test-data` | On schema change | Schema, data quality, migration, pipeline integrity |
| `/mutation-test [--module path]` | Weekly | Test suite quality — Stryker/mutmut/PITest |
| `/chaos-test` | Weekly in staging | Fault injection — circuit breakers, timeouts, recovery |

---

## PR workflow

| Command | What it does |
|---------|-------------|
| `/create-pr` | Open PR with full description + gate evidence. Blocked if any gate fails. |
| `/review-pr <n>` | 6-dimension code review — posts inline comments, APPROVE or REQUEST_CHANGES |

---

## Fix loop

| Command | What it does |
|---------|-------------|
| `/fix-issues [quality\|security\|tests\|nfr]` | Read latest gate report, auto-fix all possible issues, produce human-action list for the rest |

---

## Navigation and utilities

| Command | When to use |
|---------|------------|
| `/progress` | Show current state and the next recommended command |
| `/debug` | Start or resume a scientific debug session |
| `/quick` | Ad-hoc tasks — bug fixes outside the phase flow |
| `/help` | Show this reference |

---

## Kit management

| Command | What it does |
|---------|-------------|
| `/create-agent <name>` | Create a new specialist agent on demand |
| `/create-skill <name>` | Create a new coding standards skill on demand |

---

## Milestone management

| Command | When to use |
|---------|------------|
| `/audit-milestone` | Verify all requirements for this milestone are met |
| `/complete-milestone` | Archive milestone artifacts, tag the release |
| `/new-milestone [name]` | Start the next version's roadmap |

---

## Roadmap management

| Command | What it does |
|---------|-------------|
| `/add-phase [description]` | Append a new phase to the end of the roadmap |
| `/insert-phase <N>` | Insert a phase at position N, renumber subsequent phases |
| `/remove-phase <N>` | Remove phase N and renumber subsequent phases |

---

## Testing cadence summary

```
Every commit   → lint + type-check + unit tests (< 5 min)
Every PR       → /run-tests → /test-integrations → /quality-gate → /security-scan
Post-deploy    → /smoke-test
Schema change  → /test-data
Weekly         → /mutation-test  ·  /chaos-test  ·  /nfr-test
Per bug fix    → write regression test BEFORE the fix
```

---

## Full workflow summary

```
SETUP (once):
  /init → /new-project → /bootstrap-kit → set up ci/ pipeline

PER PHASE:
  /discuss-phase N → /plan-phase N → /execute-phase N
  /run-tests → /test-integrations → /quality-gate → /security-scan
  /create-pr → /review-pr → merge → /verify-work N
  (run /clear between phases to reset context — state is in .planning/)

MILESTONE:
  /audit-milestone → /complete-milestone → /new-milestone

RE-ARCHITECTURE:
  /init --rearchitect ../old  → /audit-codebase ../old
  /new-project → /bootstrap-kit
  /parity-check <group> → /execute-phase 4a → /verify-work 4a
```

---

## Accessibility — WCAG 2.2 AA

`/nfr-test` tests against WCAG 2.2 AA (current standard, October 2023).

**Automated** (axe-core with `wcag22aa` tag): ~40% of criteria caught.
**Manual plan generated**: keyboard, screen reader, colour, zoom, text spacing, motion, target size, WCAG 2.2 new criteria (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8).

See `.agents/skills/accessibility/SKILL.md` for all 50 A+AA criteria with code examples.

