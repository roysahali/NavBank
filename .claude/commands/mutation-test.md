---
name: mutation-test
description: Test the quality of your test suite by injecting small bugs and verifying tests catch them. Run weekly, not per PR.
argument-hint: "[--module <path>] [--threshold <score>]"
---
<objective>
Spawn the mutation-test-agent to run Stryker/mutmut/PITest against business-critical modules and identify test suite gaps. Recommended cadence: weekly or on significant test suite changes.
</objective>
<pre_check>
Warn about runtime:
```bash
echo "Note: Mutation testing is slow (10–60 minutes depending on codebase size)."
echo "Targeting business logic modules only — not the full codebase."
```
</pre_check>
<execution>

## Step 1: Identify target modules
From argument `--module` or ask: "Which modules contain the most important business logic? (e.g. src/services/, src/domain/)"

## Step 2: Set threshold
Default threshold: 80% mutation score. Override with `--threshold` argument.

## Step 3: Spawn mutation-test-agent
```
Task("Run mutation tests", {
  agent: "mutation-test-agent",
  prompt: `
    Run mutation tests on the following modules: ${MODULE_PATH:-src/services/,src/domain/}
    Passing threshold: ${THRESHOLD:-80}%

    1. Detect and configure the right mutation tool for this stack
    2. Run mutation tests on target modules only
    3. Parse surviving mutants
    4. Classify each: genuine gap vs equivalent mutant
    5. Generate concrete test recommendations for each genuine gap
    6. Write MUTATION-TEST-RESULTS.md with scores and recommendations
  `
})
```

## Step 4: Report
```
If score >= 80%:  "Mutation score: {N}%. Test suite is strong."
If score 50-79%: "Mutation score: {N}%. WARN — {N} gaps identified.
                  Add the recommended tests before next release."
If score < 50%:  "Mutation score: {N}%. FAIL — test suite is dangerously weak.
                  {N} business logic gaps. See MUTATION-TEST-RESULTS.md."
```
</execution>
