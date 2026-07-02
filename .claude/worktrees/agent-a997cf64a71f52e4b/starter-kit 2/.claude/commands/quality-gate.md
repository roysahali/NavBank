---
name: quality-gate
description: Detect tech stack, run appropriate free static analysis tools, auto-fix violations, escalate what remains. SonarQube is optional.
argument-hint: "[phase_number]"
---
<objective>
Detect the project's tech stack, select the correct free static analysis tools, run them, auto-fix violations, and drive the gate to PASS using the fix-loop-agent. SonarQube only runs if SONAR_TOKEN is configured — the gate never depends on it.
</objective>
<execution>

## Step 1: Verify tests passed
```bash
cat .planning/phases/*/TEST-RESULTS.md 2>/dev/null | grep "Gate decision" | tail -1
```
If tests have not passed: "Run /run-tests first."

## Step 2: Spawn code-quality-agent (first scan)
```
Task("Detect stack and run quality gate", {
  agent: "code-quality-agent",
  prompt: `
    Step 1: Detect tech stack (Node/Python/Java/Go/Rust/Ruby/.NET or mixed).
    Step 2: Run ALL appropriate free tools for that stack:
      - JS/TS:    ESLint + tsc + Biome (if configured) + Semgrep
      - Python:   Ruff + Mypy + Pylint + Bandit + Vulture + Semgrep
      - Java:     Checkstyle + SpotBugs + PMD + Semgrep
      - Go:       go vet + golangci-lint + staticcheck + Semgrep
      - Rust:     cargo check + cargo clippy
      - Ruby:     RuboCop + Brakeman
      - .NET:     dotnet format + Roslyn analyzers
      - All:      CodeQL (if CLI available) + Semgrep
      - Optional: SonarQube ONLY if SONAR_TOKEN env var is set
    Step 3: Apply auto-fixes (formatters, safe style fixes)
    Step 4: Classify remaining issues: auto-fixable / code-change / human-required
    Step 5: Write .planning/phases/{PHASE}/QUALITY.md with:
      - Which stack was detected
      - Which tools ran
      - Whether SonarQube ran or was skipped and why
      - All violations classified
  `
})
```

## Step 3: If FAIL — trigger fix loop
```bash
RESULT=$(grep "Gate decision" .planning/phases/*/QUALITY.md 2>/dev/null | tail -1)
echo "Initial result: $RESULT"
```

If FAIL:
```
Task("Fix quality violations", {
  agent: "fix-loop-agent",
  prompt: `
    <files_to_read>
      .planning/phases/{PHASE}/QUALITY.md
      CLAUDE.md
    </files_to_read>

    Gate type: quality
    Phase: {PHASE}
    Max iterations: 3

    Fix loop:
    1. Run stack-appropriate formatters (ESLint --fix / ruff --fix / gofmt / rubocop --auto-correct)
    2. For complexity violations: spawn executor to extract helper functions
    3. For duplication: spawn executor to extract shared utilities
    4. For dead code: spawn executor to remove unused exports/functions
    5. After each iteration: re-run the same tools that found the issue
    6. Never run SonarQube in fix loop — use the fast free tools only
    7. Write FIXED-ISSUES.md
  `
})
```

## Step 4: Re-run gate
```
Task("Re-run quality gate post-fix", {
  agent: "code-quality-agent",
  prompt: `Re-run quality analysis. Update .planning/phases/{PHASE}/QUALITY.md.
  Skip SonarQube if it wasn't run initially — keep the same tools.`
})
```

## Step 5: Report
```
✅ PASS:
  Stack: {detected stack}
  Tools run: {list}
  SonarQube: {run / skipped — not configured}
  Fixed automatically: {N} violations
  Next: /security-scan

⚠️ ESCALATED:
  {N} violations fixed. {N} require human attention:
  1. {issue} in {file} — {action needed}

  Note: SonarQube is optional. The gate above uses free tools
  that provide equivalent coverage.
```
</execution>
