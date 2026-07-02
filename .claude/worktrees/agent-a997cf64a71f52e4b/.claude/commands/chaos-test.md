---
name: chaos-test
description: Inject controlled failures to verify system resilience and graceful degradation
argument-hint: "[--staging-url <url>] [--scenario <name>]"
---
<objective>
Spawn the chaos-test-agent to deliberately inject system failures and verify resilience patterns work correctly. Run weekly in staging. Never run against production without explicit sign-off.
</objective>
<pre_check>
Confirm environment:
```bash
echo "Target: ${STAGING_URL:-http://localhost:3000}"
echo "Environment: ${ENVIRONMENT:-local}"
[ "${ENVIRONMENT}" = "production" ] && echo "WARNING: Never run chaos tests in production" && exit 1 || true
```
</pre_check>
<execution>

## Step 1: Safety confirmation
Ask: "Confirm you are running chaos tests against staging or local (not production). Type 'confirmed' to proceed."
Wait for confirmation before spawning the agent.

## Step 2: Spawn chaos-test-agent
```
Task("Run chaos tests", {
  agent: "chaos-test-agent",
  prompt: `
    <files_to_read>
      CLAUDE.md
      .planning/audit/INTEGRATIONS.md
    </files_to_read>
    Run chaos tests against: ${STAGING_URL:-http://localhost:3000}
    Scenario filter: ${SCENARIO:-all}

    1. Map all external dependencies from CLAUDE.md
    2. Write hypothesis for each dependency failure
    3. Inject faults using available tools (Toxiproxy, iptables, Docker)
    4. Verify circuit breakers fired and fallbacks activated
    5. Verify recovery after fault removal
    6. Write CHAOS-TEST-RESULTS.md

    SAFETY: Remove ALL injected faults before finishing, regardless of test outcome.
  `
})
```

## Step 3: Report
```
If PASS:  "Chaos tests passed — system handles failures gracefully."
If FAIL:  "Chaos tests found resilience gaps. Fix before production deployment.
           See CHAOS-TEST-RESULTS.md for specific missing circuit breakers or timeouts."
If PARTIAL: "Some experiments could not run (tooling not available). 
             Documented in CHAOS-TEST-RESULTS.md."
```
</execution>
