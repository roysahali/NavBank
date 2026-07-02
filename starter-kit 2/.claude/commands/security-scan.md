---
name: security-scan
description: Run OWASP, CVE, secret detection and SAST checks. Auto-fix patchable issues, escalate the rest.
argument-hint: "[phase_number]"
---
<objective>
Spawn the security-scanner-agent to find vulnerabilities. If found: auto-patch dependencies, fix code patterns via fix-loop-agent, clearly escalate what cannot be auto-fixed. Never proceed to /create-pr with unacknowledged CRITICAL/HIGH findings.
</objective>
<execution>

## Step 1: Verify quality gate passed
```bash
cat .planning/phases/*/QUALITY.md 2>/dev/null | grep "Gate decision" | tail -1
```
If quality gate hasn't passed: "Run /quality-gate first."

## Step 2: Spawn security-scanner-agent (first scan)
```
Task("Run security scan", {
  agent: "security-scanner-agent",
  prompt: `
    Run full security scan on all changed files.
    Write report to .planning/phases/{PHASE}/SECURITY.md
    Classify each finding as:
    - AUTO-PATCHABLE: dependency with available fix, format issue
    - CODE-FIX-NEEDED: OWASP pattern in source code
    - ARCHITECTURAL: missing auth check, structural issue
    - REQUIRES-HUMAN: no patch available, risk decision needed
  `
})
```

## Step 3: If FAIL — trigger fix loop
```bash
CRITICAL=$(grep -c "CRITICAL\|HIGH" .planning/phases/*/SECURITY.md 2>/dev/null || echo 0)
```

If CRITICAL > 0:
```
Task("Fix security violations", {
  agent: "fix-loop-agent",
  prompt: `
    <files_to_read>
      .planning/phases/{PHASE}/SECURITY.md
      CLAUDE.md
    </files_to_read>

    Gate type: security
    Phase: {PHASE}
    Max iterations: 3

    Fix loop:
    1. AUTO-PATCHABLE deps: run npm audit fix / pip install --upgrade
    2. SECRET in code: move to environment variable, remove from git history
    3. SQL injection patterns: replace with parameterised queries
    4. Missing input validation: add validation at all entry points
    5. Weak crypto (MD5/SHA1): replace with bcrypt/SHA-256
    6. After each fix: re-run the specific security check to verify
    7. Architectural/risk issues: document clearly for human decision
    8. Write FIXED-ISSUES.md

    CRITICAL RULE: If a secret was committed, STOP and escalate immediately —
    git history must be cleaned by a human. Do not attempt to fix git history.
  `
})
```

## Step 4: Re-run security scan
```
Task("Re-run security scan post-fix", {
  agent: "security-scanner-agent",
  prompt: `Re-run security scan. Update .planning/phases/{PHASE}/SECURITY.md.`
})
```

## Step 5: Report
```
If PASS:
  "✅ Security scan PASSED — no CRITICAL/HIGH findings"
  "Fixed automatically: {N} issues"
  "Next: /nfr-test or /create-pr"

If ESCALATED:
  "⚠️ {N} security issues fixed. {N} require human decision:"
  "1. {issue} — {why human needed} — {action required}"
  "PR cannot open until CRITICAL/HIGH are acknowledged or resolved."

If SECRETS FOUND:
  "🚨 SECRET COMMITTED — immediate action required:"
  "1. Rotate the exposed credential NOW (before fixing code)"
  "2. Clean git history: git filter-branch or BFG Repo-Cleaner"
  "3. Notify security team"
  "Claude Code cannot clean git history — human action required."
```
</execution>
