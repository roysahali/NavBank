# SKILL.md — Git Conventions

## Commit Messages

### Format
```
{type}({scope}): {description}
```

### Types
| Type | When to Use |
|------|------------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, config changes |
| `style` | Formatting, whitespace (no logic change) |
| `perf` | Performance improvement |

### Scope
- During phased development: use `{phase}-{plan}` (e.g., `01-02`)
- General work: use the affected area (e.g., `auth`, `api`, `ui`, `db`)

### Description
- Lowercase, no period at end
- Imperative mood ("add feature" not "added feature")
- Max 72 characters
- What changed, not how

### Examples
```
feat(02-01): add user registration endpoint
fix(auth): resolve session expiry race condition
docs(api): document rate limiting headers
test(02-03): add integration tests for login flow
chore(deps): upgrade prisma to 5.9.0
refactor(db): extract query builder utility
```

## Branching Strategy

### Default: Trunk-Based
```
main ← all commits go here during phase execution
```

For solo/small team projects, commit directly to `main`. The atomic commit pattern (one commit per task) provides sufficient granularity for rollback.

### Alternative: Feature Branches
```
main
 └── feat/{phase}-{description}
      └── merge back to main after phase verification
```

Use when:
- Multiple people working simultaneously
- CI/CD pipeline requires PR reviews
- Project policy requires branch protection

## What to Commit

### Always Commit
- Source code (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, etc.)
- Configuration files (`tsconfig.json`, `next.config.js`, etc.)
- Package manifests (`package.json`, `package-lock.json`)
- Database schema and migrations (`prisma/schema.prisma`, `prisma/migrations/`)
- Documentation (`.md` files)
- Test files
- Static assets used by the application
- CI/CD configuration (`.github/workflows/`)
- `.planning/` artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md)

### Never Commit
- `.env` files (use `.env.example` with placeholder values)
- `node_modules/`
- Build output (`dist/`, `.next/`, `build/`)
- IDE settings (`.vscode/`, `.idea/`) — unless team-shared
- OS files (`.DS_Store`, `Thumbs.db`)
- Secrets, API keys, passwords, tokens
- Large binary files (use Git LFS if needed)
- Debug logs or temporary files

## .gitignore Template
```
# Dependencies
node_modules/

# Build
dist/
.next/
build/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Misc
*.tsbuildinfo
```

## Atomic Commit Rules

During phased execution:
1. **One commit per task** — never batch multiple tasks
2. **Only files from the task** — don't include unrelated changes
3. **Verify before committing** — run the task's `<verify>` step first
4. **Commit immediately** — don't accumulate uncommitted changes across tasks

```bash
# Pattern for each task
git add {specific files from task}
git commit -m "{type}({scope}): {description}"
```

## Tags
- Milestone completion: `v{version}` (e.g., `v1.0.0`)
- Follow semver: MAJOR.MINOR.PATCH
