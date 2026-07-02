---
name: complete-milestone
description: Archive milestone and tag release
---

<objective>
Archive the current milestone's planning artifacts, tag the release in git, and prepare for the next milestone.
</objective>

<execution>

## Step 1: Verify Audit Passed

Check `.planning/MILESTONE-AUDIT.md` exists and shows ready status.
If not: "Run /audit-milestone first."

## Step 2: Archive

```bash
VERSION=$(grep "milestone:" .planning/ROADMAP.md | head -1 | sed 's/.*: "//' | sed 's/"//')
mkdir -p .planning/milestones/${VERSION}
cp .planning/ROADMAP.md .planning/milestones/${VERSION}/
cp .planning/REQUIREMENTS.md .planning/milestones/${VERSION}/
cp .planning/MILESTONE-AUDIT.md .planning/milestones/${VERSION}/
cp -r .planning/phases/ .planning/milestones/${VERSION}/phases/
```

## Step 3: Update Milestones Log

Append to `.planning/MILESTONES.md`:

```markdown
## {version} — {date}
- Phases: {N} completed
- Requirements: {N} satisfied
- Commits: {range}
```

## Step 4: Tag Release

```bash
git add .planning/
git commit -m "docs: archive milestone ${VERSION}"
git tag -a "${VERSION}" -m "Milestone ${VERSION} complete"
```

## Step 5: Clean Up

Remove phase artifacts (they're archived):
```bash
rm -rf .planning/phases/*/
rm -f .planning/MILESTONE-AUDIT.md
```

## Step 6: Report

```
═══════════════════════════════════════════
  MILESTONE COMPLETE: {version} 🎉
═══════════════════════════════════════════

Tagged: {version}
Archived: .planning/milestones/{version}/

Next: /new-milestone to plan the next version.
```
</execution>
