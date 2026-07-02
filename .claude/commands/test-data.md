---
name: test-data
description: Run data quality, schema validation, and pipeline integrity tests
argument-hint: "[phase_number]"
---
<objective>
Spawn the data-test-agent to verify database schema, data quality constraints, and pipeline correctness. Run when database schema changes, migrations are added, or data pipelines are modified.
</objective>
<execution>

## Step 1: Check for data assets
```bash
find . -name "*.sql" -o -name "*.prisma" -o -name "schema.rb" \
  -o -path "*/migrations/*.py" | grep -v node_modules | head -10
find . -name "*.py" | xargs grep -l "pandas\|great_expectations\|dbt" 2>/dev/null | head -5
```

If no data assets found: "No database schema or pipeline code detected. /test-data is most useful for projects with database migrations or data pipelines."

## Step 2: Spawn data-test-agent
```
Task("Run data tests", {
  agent: "data-test-agent",
  prompt: `
    <files_to_read>
      CLAUDE.md
    </files_to_read>
    Run full data test suite for phase {PHASE}.
    1. Schema validation tests
    2. Data quality tests (uniqueness, referential integrity, ranges)
    3. Migration reversibility tests
    4. Pipeline idempotency tests (if pipelines exist)
    Write results to .planning/phases/{PHASE}/DATA-TEST-RESULTS.md
  `
})
```

## Step 3: Report
```
If PASS:  "Data tests passed. Schema, quality, and pipeline integrity verified."
If FAIL:  "Data tests failed. See DATA-TEST-RESULTS.md for details.
           Data failures are blockers — fix before /create-pr."
```
</execution>
