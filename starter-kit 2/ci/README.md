# CI/CD Pipeline Configuration

Two ready-to-use pipeline configs. Copy the one matching your platform to your project root.

## GitHub Actions

```bash
mkdir -p .github/workflows
cp ci/github-actions.yml .github/workflows/pipeline.yml
```

## GitLab CI

```bash
cp ci/gitlab-ci.yml .gitlab-ci.yml
```

---

## Claude Code command → CI tool mapping

This is the key insight: **Claude Code is your development workflow tool. CI/CD is your enforcement layer.**
Claude Code commands run interactively during development. CI runs the underlying tools automatically on every PR and merge.

| Claude Code command | What CI runs directly | Where in pipeline |
|---------------------|----------------------|-------------------|
| `/run-tests` | `npm test` · `pytest` · `go test ./...` · `mvn test` | Every commit + every PR |
| `/quality-gate` | `sonar-scanner` · `eslint --max-warnings 0` · `npx depcruise` · `lint-imports` | Every PR |
| `/security-scan` | `npm audit --audit-level=high` · `semgrep` · `gitleaks` · `trivy` · `pip-audit` | Every PR |
| `/smoke-test` | `curl /health` health check script | After every deploy |
| `/test-data` | `pytest tests/data/` · `dbt test` · `great_expectations` | On schema/migration changes |
| `/test-integrations` | `pytest tests/integration/` · Pact provider verification | Every PR |
| `/mutation-test` | `npx stryker run` · `mutmut run` · `mvn pitest:mutationCoverage` | Weekly schedule |
| `/chaos-test` | Toxiproxy + custom test script | Weekly schedule |
| `/nfr-test` | `k6 run` · `npx pa11y` · `npx @axe-core/cli` · `npx lighthouse` | Weekly schedule |
| `/nfr-test` (load) | `artillery run` · `locust` · `gatling` | Weekly schedule |

The CI files in this folder implement this mapping exactly.
You do **not** need Claude Code installed in CI — CI calls the tools directly.

---

## What runs when

| Trigger | Jobs | Target time |
|---------|------|-------------|
| Every commit | Lint + type-check + unit tests | < 5 min |
| Every PR / MR | + Integration · Contract · Data · Quality gate · Security scan | < 20 min |
| Merge to main | + E2E → deploy staging → smoke test | ~10 min |
| Production deploy | Manual approval → deploy → smoke test → auto-rollback if fails | Manual |
| Weekly schedule | Mutation · Load/NFR · Accessibility audit | 60–90 min |

---

## Secrets to configure

Add these in your CI platform before the pipeline runs:

| Secret | Required | What it enables |
|--------|----------|-----------------|
| `SONAR_TOKEN` | Recommended | SonarQube/SonarCloud quality gate |
| `SONAR_HOST_URL` | Recommended | Your SonarQube server URL |
| `STAGING_URL` | Required | Smoke tests after staging deploy |
| `PRODUCTION_URL` | Required | Smoke tests after production deploy |
| `DEPLOY_KEY` | Required | Your deployment mechanism |
| `SNYK_TOKEN` | Optional | Enhanced dependency scanning (falls back to npm audit) |
| `PACT_BROKER_URL` | Optional | Contract testing broker |
| `PACT_BROKER_TOKEN` | Optional | Contract testing auth |

---

## Customise for your stack

**Node.js (default):** No changes needed.

**Python:**
```yaml
- pip install -r requirements.txt   # install
- ruff check . && mypy src/         # lint  (/quality-gate)
- pytest tests/unit/ --cov=src      # unit tests  (/run-tests)
- pytest tests/integration/         # integration tests
- pytest tests/data/                # data tests  (/test-data)
- pip-audit --fail-on-vuln          # dependency audit  (/security-scan)
- mutmut run                        # mutation tests  (/mutation-test)
```

**Java / Maven:**
```yaml
- mvn dependency:resolve -q         # install
- mvn checkstyle:check              # lint  (/quality-gate)
- mvn test -Dtest="**/*UnitTest"    # unit tests  (/run-tests)
- mvn test -Dtest="**/*IntegTest"   # integration tests
- mvn org.owasp:dependency-check-maven:check   # security  (/security-scan)
- mvn org.pitest:pitest-maven:mutationCoverage # mutation  (/mutation-test)
- mvn package -DskipTests           # build
```

**Go:**
```yaml
- go mod download                   # install
- golangci-lint run                 # lint  (/quality-gate)
- go test ./... -short              # unit tests  (/run-tests)
- go test ./... -run Integration    # integration tests
- govulncheck ./...                 # security  (/security-scan)
- go build ./...                    # build
```

---

## Deployment commands

Search for `Configure your deployment command here` in both YAML files and replace:

```bash
# Heroku
heroku container:push web --app my-app-staging

# Kubernetes
kubectl set image deployment/my-app my-app=my-image:$COMMIT_SHA --namespace staging

# AWS ECS
aws ecs update-service --cluster my-cluster --service my-service --force-new-deployment

# Fly.io
fly deploy --remote-only --app my-app-staging

# Railway / Render / Vercel
# These auto-deploy from git — remove the deploy job and keep smoke tests only
```

## Rollback commands

Search for `Configure your rollback command here`:

```bash
# Heroku
heroku rollback --app my-app-staging

# Kubernetes
kubectl rollout undo deployment/my-app --namespace staging

# AWS ECS — redeploy previous task definition version
aws ecs update-service --cluster my-cluster --service my-service \
  --task-definition my-task:PREVIOUS_REVISION
```
