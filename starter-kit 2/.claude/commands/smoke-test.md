---
name: smoke-test
description: Quick post-deployment health check — verifies system starts, responds, and core flows work. Under 2 minutes.
argument-hint: "[environment-url]"
---
<objective>
Run a fast smoke test after deployment. Verify the system is alive and the most critical paths respond correctly before any further testing. Failure = trigger rollback immediately.
</objective>
<execution>

## Step 1: Determine target URL
From argument or environment:
```bash
BASE_URL=${1:-${APP_URL:-http://localhost:3000}}
echo "Running smoke tests against: $BASE_URL"
```

## Step 2: Spawn test-agent in smoke mode
```
Task("Run smoke tests", {
  agent: "test-agent",
  prompt: `
    Run a smoke test suite against: ${BASE_URL}

    Smoke tests must complete in under 2 minutes total.
    Maximum 15 tests. Check only:

    1. Health check endpoint returns 200
       curl -sf ${BASE_URL}/health || curl -sf ${BASE_URL}/api/health

    2. Application responds (not 502/503/504)
       curl -sf ${BASE_URL}/ or ${BASE_URL}/api/

    3. Database connection works
       Health endpoint shows database: ok

    4. One critical read endpoint responds with valid shape
       e.g. GET /api/users or /api/products — any authenticated list endpoint

    5. Authentication endpoint responds
       POST /api/auth/login or /api/login — with test credentials if available

    If any check fails: report FAIL immediately — do not continue.
    Write results to .planning/smoke-test-results.md
  `
})
```

## Step 3: Report
```
If PASS:  "Smoke tests passed in {N}s. System is healthy. Safe to proceed."
If FAIL:  "SMOKE TESTS FAILED — trigger rollback immediately.
           Failed check: {which check failed}
           Error: {error message}"
```
</execution>
