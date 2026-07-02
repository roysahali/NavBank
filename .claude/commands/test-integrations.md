---
name: test-integrations
description: Run integration tests — verifies real connections between systems, not mocks
argument-hint: "[phase_number] [--contracts-only] [--connectivity-only]"
---

<objective>
Spawn the integration-test-agent to test real system connections, verify contracts are honoured, and check integration health. Run after /run-tests (unit) and before /create-pr for projects with external integrations.
</objective>

<pre_check>
Check integration test directory:
```bash
ls tests/integration/ 2>/dev/null | head -10 || echo "No integration tests yet — will create"
```

Check environment:
```bash
# Verify test environment is configured
cat .env.test 2>/dev/null | grep -v "secret\|password\|key" | head -10
docker ps 2>/dev/null | grep -E "postgres|redis|rabbit|kafka" | head -5
```

Flags:
- `--contracts-only`: run Pact/OpenAPI contract verification only, skip other tests
- `--connectivity-only`: run health checks only, skip test execution
</pre_check>

<execution>

## Step 1: Determine phase
Use provided phase number or read `.planning/STATE.md` for current phase.

## Step 2: Spawn integration-test-agent

```
Task("Run integration tests", {
  agent: "integration-test-agent",
  prompt: `
    <files_to_read>
      .planning/audit/INTEGRATIONS.md
      CLAUDE.md
    </files_to_read>

    Run integration tests for phase {PHASE}.
    Flags: contracts-only={CONTRACTS_ONLY}, connectivity-only={CONNECTIVITY_ONLY}

    1. Map all integration points from CLAUDE.md and INTEGRATIONS.md
    2. Set up test environment (docker-compose if available)
    3. Write missing integration tests for any untested connections
    4. Run contract verification (Pact / OpenAPI)
    5. Run health connectivity checks
    6. Run all integration tests
    7. Write .planning/phases/{PHASE}/INTEGRATION-TEST-RESULTS.md
  `
})
```

## Step 3: Report

Show results and gate decision:

```
If PASS:  "Integration tests passed. Run /quality-gate next."
If FAIL:  "Integration tests failed. Fix failures before /create-pr."
If PARTIAL: "Some integrations could not be tested (missing sandbox credentials).
             See INTEGRATION-TEST-RESULTS.md. Acceptable if external sandbox
             unavailable in dev — must pass in staging CI."
```

</execution>
