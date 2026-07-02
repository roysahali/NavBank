# SKILL.md — CI/CD

## Overview
Standards for CI/CD pipeline design. Apply when setting up or modifying GitHub Actions, GitLab CI, or any pipeline. These rules ensure pipelines are fast, reliable, and safe.

---

## Pipeline Structure

Every pipeline has three stages in order. Never skip or merge them:

```
1. VERIFY   — fast checks that catch obvious problems (< 5 min)
             lint, type-check, unit tests, build

2. TEST     — deeper checks that need dependencies (< 15 min)
             integration tests, security scan, quality gate

3. DEPLOY   — environment promotion (manual gate on production)
             staging auto-deploy, production manual-approve
```

### GitHub Actions example structure
```yaml
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit

  test:
    needs: verify          # only runs if verify passes
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:integration
      - run: npm audit --audit-level=high

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    environment: staging   # maps to GitHub environment with secrets
    steps:
      - run: ./scripts/deploy.sh staging

  deploy-production:
    needs: deploy-staging
    environment:
      name: production
      url: https://app.example.com
    steps:                 # requires manual approval in GitHub Environments
      - run: ./scripts/deploy.sh production
```

---

## Environment Rules

Three environments minimum: `dev` → `staging` → `production`

| Environment | Who deploys | Approval | Data |
|-------------|-------------|----------|------|
| dev | Auto on feature branch push | None | Seeded test data |
| staging | Auto on merge to main | None | Anonymised prod copy |
| production | Auto, triggered from staging | Manual approval | Live |

---

## Secret Management

✅ Always use environment-specific secrets:
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}  # set per environment in GitHub
  API_KEY: ${{ secrets.STRIPE_API_KEY }}
```
❌ Never hardcode credentials in pipeline files
❌ Never share secrets across environments — staging and production use separate keys

---

## Pipeline Rules

- Pipelines must complete in under 20 minutes total — split or optimise if slower
- Cache dependencies between runs: `actions/cache` for node_modules, pip, go modules
- Pin action versions: `actions/checkout@v4` not `actions/checkout@latest`
- Every pipeline step has a `name:` label — not cryptic `run: sh ./thing.sh`
- Failed pipelines block merge — never add `continue-on-error: true` to test steps
- Secrets rotate every 90 days — add a calendar reminder when creating them

---

## Deployment Rules

- Every deployment is a git tag — `git tag v1.2.3 && git push --tags`
- Every deployment has a rollback path — `./scripts/deploy.sh rollback` must work
- Migrations run before code deploys, not after — schema must be backwards-compatible
- Health check must pass before marking deployment complete
- Zero-downtime: use rolling deployments, not stop-and-replace

---

## Checklist

- [ ] Pipeline has all three stages: verify → test → deploy
- [ ] Production deploy requires manual approval
- [ ] All secrets use environment variables, never hardcoded
- [ ] Dependencies cached between runs
- [ ] Action versions pinned (not `@latest`)
- [ ] Rollback script exists and tested
- [ ] Migrations run before code deployment
