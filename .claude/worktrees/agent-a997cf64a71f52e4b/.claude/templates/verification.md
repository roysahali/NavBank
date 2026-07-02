---
phase: "{phase-number}-{phase-name}"
status: "passed"  # passed | gaps_found
must_haves_total: 0
must_haves_passed: 0
must_haves_failed: 0
requirements_satisfied: []
requirements_unsatisfied: []
---

# Phase Verification: {Phase Name}

## Summary
{One paragraph overall assessment}

## Must-Have Verification

| # | Must-Have | Source | REQ-ID | Status | Evidence |
|---|-----------|--------|--------|--------|----------|
| 1 | {must-have} | {plan} | {req} | ✅/❌ | {evidence} |

## Requirement Traceability

| REQ-ID | Description | Source Plans | Must-Haves | Status |
|--------|-------------|-------------|------------|--------|
| REQ-01 | {desc} | 01-01 | MH-1, MH-2 | ✅ Satisfied |

## Test Results
```
{output of test run}
```

## Gaps Found
{If any — structured gap descriptions. "None" if all passed.}

## Conclusion
{passed | gaps_found — with next steps}
