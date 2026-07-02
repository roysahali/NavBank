---
name: create-pr
description: Create a pull request with full description, gate evidence, and requirements linkage
argument-hint: "[phase_number]"
---
<objective>
Spawn the pr-creator-agent to push the branch and open a PR with a complete description. All gates must pass first.
</objective>
<execution>
## Step 1: Verify all gates passed
```bash
echo "=== Test ===" && grep "Gate decision" .planning/phases/{PHASE}-*/TEST-RESULTS.md 2>/dev/null
echo "=== Quality ===" && grep "Gate decision" .planning/phases/{PHASE}-*/QUALITY.md 2>/dev/null
echo "=== Security ===" && grep "Gate decision" .planning/phases/{PHASE}-*/SECURITY.md 2>/dev/null
```
If any gate shows FAIL, stop and tell the user which gate to fix first.

## Step 2: Spawn pr-creator-agent
```
Task("Create pull request", {
  agent: "pr-creator-agent",
  prompt: `
    <files_to_read>
      .planning/REQUIREMENTS.md
      .planning/phases/{PHASE}-*/TEST-RESULTS.md
      .planning/phases/{PHASE}-*/QUALITY.md
      .planning/phases/{PHASE}-*/SECURITY.md
      .planning/phases/{PHASE}-*/CONTEXT.md
    </files_to_read>
    Create a PR for phase {PHASE}.
    All gates have passed — include the gate evidence in the PR description.
  `
})
```

## Step 3: Report PR URL
Show the PR URL and: "PR is open. Run /review-pr {pr-number} before merging."
</execution>
