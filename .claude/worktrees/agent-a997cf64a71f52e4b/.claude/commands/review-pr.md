---
name: review-pr
description: Review an open PR across 6 dimensions and post inline comments with APPROVE/REQUEST_CHANGES decision
argument-hint: "<pr-number>"
---
<objective>
Spawn the pr-reviewer-agent to do a structured review of the given PR and post comments directly on GitHub/GitLab.
</objective>
<execution>
## Step 1: Get PR number
From argument or ask: "Which PR number should I review?"

## Step 2: Spawn pr-reviewer-agent
```
Task("Review PR {pr-number}", {
  agent: "pr-reviewer-agent",
  prompt: `
    <files_to_read>
      .planning/REQUIREMENTS.md
      .planning/phases/*/TEST-RESULTS.md
      .planning/phases/*/QUALITY.md
      .planning/phases/*/SECURITY.md
    </files_to_read>
    Review PR number {pr-number}.
    Check all 6 dimensions: correctness, security, tests, maintainability, architecture, requirements.
    Post inline comments and give APPROVE or REQUEST_CHANGES decision.
  `
})
```

## Step 3: Report decision
Show the review decision (APPROVE / REQUEST_CHANGES) and summary.
If APPROVE: "PR is approved and ready to merge."
If REQUEST_CHANGES: "PR needs changes. See comments on the PR for details."
</execution>
