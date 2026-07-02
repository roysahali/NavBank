---
name: audit-codebase
description: Phase 1 of re-architecture — reads old codebase and produces four audit documents (feature inventory, data model, integrations, debt register)
argument-hint: "<source-path> [e.g. ../old-system]"
---

<objective>
Spawn the feature-extractor agent to analyse the old codebase and produce the four audit documents that become the specification for re-architecture. This is Phase 1 — must complete before design or any building begins.
</objective>

<pre_check>
Check the source path exists:
```bash
test -d {SOURCE_PATH} && echo "EXISTS" || echo "NOT FOUND"
ls {SOURCE_PATH} | head -10
```

Check if audit already exists:
```bash
test -f .planning/audit/FEATURE-INVENTORY.md && echo "AUDIT EXISTS" || echo "NO AUDIT YET"
```

If audit exists: ask "Audit documents already exist. Re-run and overwrite, or continue to Phase 2?"

Create output directory:
```bash
mkdir -p .planning/audit
```
</pre_check>

<execution>

## Step 1: Confirm the source path

If no argument provided, ask:
> "What is the path to the old codebase? (e.g. ../old-system or /path/to/old-project)"

## Step 2: Spawn feature-extractor agent

```
Task("Audit old codebase at {SOURCE_PATH}", {
  agent: "feature-extractor",
  prompt: `
    Analyse the old codebase at: {SOURCE_PATH}

    This is a READ-ONLY reference. Never modify it. Never commit to it.

    Produce these four documents in .planning/audit/:
    1. FEATURE-INVENTORY.md  — every user-facing feature with business rules and edge cases
    2. DATA-MODEL.md         — every table/collection with migration decisions
    3. INTEGRATIONS.md       — every external service with keep/replace/drop decision
    4. DEBT-REGISTER.md      — technical debt with leave-behind/fix/replicate decisions

    Source path: {SOURCE_PATH}
    Output directory: .planning/audit/
  `
})
```

## Step 3: Commit audit documents

```bash
git add .planning/audit/
git commit -m "docs: phase 1 audit of old codebase at {SOURCE_PATH}"
```

## Step 4: Report and gate

Show the output from the feature-extractor, then:

```
══════════════════════════════════════════
  PHASE 1 AUDIT COMPLETE
══════════════════════════════════════════

REQUIRED NEXT STEP: Team audit review meeting

Review all four documents in .planning/audit/ as a team.
Confirm every feature is captured. Agree on all debt decisions.

DO NOT start Phase 2 until the team has signed off.

After sign-off: /new-project  (starts Phase 2 design)
══════════════════════════════════════════
```

</execution>
