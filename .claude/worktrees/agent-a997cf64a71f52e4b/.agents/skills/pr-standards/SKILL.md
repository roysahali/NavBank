# SKILL.md — PR Standards

## Overview
Rules for creating and reviewing pull requests. Apply when writing PR descriptions and when reviewing others' PRs. Good PRs get merged faster and cause fewer regressions.

---

## PR Size Rules

- Max changed lines per PR: 400 (excluding generated files, migrations)
- If a feature requires > 400 lines, split into multiple PRs
- Each PR should close 1–3 requirements — not a whole phase

✅ Right size — one focused change:
`feat(auth): add email verification on signup`

❌ Too large — multiple unrelated concerns:
`feat: auth + payments + user profile + admin panel`

---

## PR Title Format

```
{type}({scope}): {imperative description under 72 chars}
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `security`

✅ `feat(payments): add Stripe webhook signature validation`
✅ `fix(auth): prevent session fixation on login`
❌ `updated stuff` (no type, no scope, not imperative)
❌ `FEAT: Added new payment feature that does X and Y and Z` (too long)

---

## Required PR Description Sections

Every PR must have:
1. **What this PR does** — 2–3 sentence plain English summary
2. **Requirements closed** — REQ-IDs from REQUIREMENTS.md
3. **Changes** — key files and what changed
4. **Testing** — evidence tests pass (paste test summary)
5. **Quality gates** — checklist of gate results
6. **Notes for reviewer** — anything that needs attention

---

## Review Rules

### For reviewers
- Comment within 24 hours of assignment
- Distinguish blockers from suggestions clearly: `[BLOCKER]` vs `[SUGGESTION]`
- Approve if no blockers, even if you have suggestions
- Don't re-review items already addressed in a previous round

### For authors
- Respond to every comment (even if just "done" or "won't fix — reason")
- Don't force-push after review starts (makes diff review impossible)
- Re-request review after addressing blockers

---

## Gate Requirements Before Opening PR

All must be green:
- [ ] Tests pass
- [ ] Quality gate: PASS
- [ ] Security scan: PASS (no CRITICAL/HIGH)
- [ ] No merge conflicts with main

---

## Checklist

- [ ] PR title follows `{type}({scope}): {description}` format
- [ ] PR is < 400 changed lines
- [ ] All required description sections present
- [ ] All quality gates passed
- [ ] Requirements linked
- [ ] Self-reviewed the diff before opening
