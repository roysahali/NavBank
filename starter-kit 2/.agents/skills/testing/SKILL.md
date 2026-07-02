---
name: sw-testing
description: >
  Comprehensive software testing skill covering all testing types — unit, integration, E2E, API,
  performance, security, data, contract, accessibility, regression, architecture, chaos, and mutation
  testing. Use whenever writing tests, creating test suites, setting up testing infrastructure,
  improving coverage, reviewing test quality, generating test cases, or discussing testing strategy.
  Trigger for any testing framework mention (Jest, pytest, Cypress, Playwright, JUnit, Vitest, k6,
  Locust, Pact, Stryker, ArchUnit) or vague requests like "add tests", "write specs", "cover edge
  cases". If code exists with no tests, suggest this skill immediately.
---

# Software Testing — Complete Guide

## Decision Framework: What Type of Test to Write

Before writing any test, identify what is actually needed:

1. **Single function/method in isolation?** → Unit Test
2. **Multiple modules talking to each other?** → Integration Test
3. **Full user journey from UI to database?** → E2E Test
4. **HTTP API endpoint contract?** → API Test
5. **Speed, throughput, or resource usage?** → Performance Test
6. **Vulnerabilities or attack vectors?** → Security Test
7. **Data correctness, migration, pipeline integrity?** → Data Test
8. **Service boundary and interface agreements?** → Contract Test
9. **Disabled users can use the software?** → Accessibility Test
10. **Old behaviour still works after changes?** → Regression Test
11. **Dependency rules, layering, code structure?** → Architecture Test
12. **Does the build even start and respond?** → Smoke Test
13. **System behaviour under deliberate failure?** → Chaos/Resilience Test
14. **Does the test suite itself catch real bugs?** → Mutation Test

When ambiguous: default to unit tests for business logic, integration tests for module boundaries.

---

## Testing Taxonomy

### Functional (does it do the right thing?)
Unit · Integration · E2E · API · Regression · Smoke · Data

### Non-Functional (does it do it well enough?)
Performance · Security · Accessibility · Chaos/Resilience

### Structural (is the code and test suite itself healthy?)
Architecture · Mutation · Static Analysis

---

## 1. Unit Testing

Test a single function, method, or class in complete isolation. Everything external gets mocked.

### Principles
- One logical behaviour per test (multiple expects are fine if asserting one thing)
- Tests must be independent — no shared mutable state, no execution order dependency
- Fast: if a unit test takes > 100ms, I/O is leaking in
- Name by behaviour: `should_reject_negative_amounts` not `test_calculate`
- Arrange → Act → Assert, always

### What to mock
Database calls, HTTP clients, file system, clocks/timers, third-party SDKs.
Never mock the thing being tested.

### What NOT to unit test
Private methods directly · Framework/library internals · Trivial getters with no logic

### Framework selection
| Language | Preferred | Fallback |
|----------|-----------|---------|
| JavaScript/TypeScript | Vitest (Vite projects), Jest (general) | Mocha |
| Python | pytest | unittest |
| Java/Kotlin | JUnit 5 + Mockito | — |
| Go | built-in testing + testify | — |
| Rust | built-in #[cfg(test)] | — |
| C# | xUnit | NUnit |

### File structure
Mirror source directory. `src/services/payment.ts` → `tests/unit/services/payment.test.ts`
Or co-locate: `src/services/payment.ts` + `src/services/payment.test.ts`

---

## 2. Integration Testing

Test how two or more real components work together. Fewer mocks, real collaborators.

### Principles
- Use real databases (testcontainers, docker-compose, SQLite for simple cases)
- Mock only external third-party services you don't control
- Test the boundaries: does Service A correctly call Repository B and handle its responses?
- Slower than unit tests — acceptable. Keep under 5s per test where possible.

### Common integration points to test
- Service → Database (queries, transactions, migrations)
- Service → Message Queue (publish/subscribe, serialisation)
- Service → Cache (invalidation, TTL, serialisation)
- Service → External API (with a mock server — WireMock, MSW, responses)
- Module A → Module B (cross-module calls with real implementations)

### Tools
Testcontainers (Java/Node/Python/Go) · Docker Compose · WireMock / MSW · Embedded databases

---

## 3. E2E Testing

Full workflow simulation from the user's perspective. Real UI, real backend, real database.

### Principles
- Test critical user journeys, not every feature — these are expensive
- Typical coverage: login, core business transaction, payment, signup
- 5–20 E2E tests for a typical application, not 500
- Flaky E2E tests are worse than no E2E tests — invest in stability
- Use explicit waits. Never `sleep()`.

### Framework selection
Web: Playwright (preferred — fast, multi-browser) · Cypress (good DX, single-browser)
Mobile: Detox (React Native) · Appium (cross-platform) · XCUITest (iOS) · Espresso (Android)

### Anti-patterns
- Testing through UI what could be tested at API level
- Sharing state between E2E tests (each test sets up its own data)
- Asserting on CSS classes or DOM structure (use data-testid)
- Screenshot comparisons without visual regression tooling

---

## 4. API Testing

Test HTTP endpoints directly. Request in, response out. No UI.

### What to assert
- HTTP status code (always)
- Response body structure and key values
- Response headers (Content-Type, Cache-Control, CORS)
- Error response format consistency
- Authentication/authorization per endpoint
- Input validation: missing fields, wrong types, boundary values, malicious input
- Idempotency for PUT/DELETE

### Framework selection
| Language | Tools |
|----------|-------|
| JS/TS | supertest + Jest/Vitest, Playwright API testing |
| Python | pytest + httpx, FastAPI TestClient |
| Java | REST Assured, Spring MockMvc |
| Language-agnostic | Postman/Newman, Bruno, Hurl |

---

## 5. Performance Testing

Test speed, scalability, and resource consumption under load. (See performance skill for thresholds.)

### Types
| Type | Tests | Example |
|------|-------|---------|
| Load | Expected concurrent users | 1000 users doing normal operations |
| Stress | Beyond expected load | Ramp to 10× until failure |
| Spike | Sudden traffic burst | 0 → 5000 users in 10 seconds |
| Soak | Sustained load over time | Normal load for 24 hours (finds memory leaks) |
| Scalability | Throughput vs resources | Double servers → throughput doubles? |

### Framework selection
k6 (preferred) · Locust (Python) · Gatling (JVM) · Artillery (Node)

### Key rule
Use p50/p95/p99 percentiles — NEVER averages. Averages lie. Define pass/fail thresholds BEFORE running.

---

## 6. Security Testing

See `security` skill for full OWASP coverage. Testing summary:

- **SAST**: Semgrep, SonarQube, CodeQL, Bandit (Python) — run in CI on every PR
- **DAST**: OWASP ZAP, Burp Suite — run against staging
- **SCA**: Snyk, npm audit, pip-audit, Trivy — run on every build
- **Secret scanning**: GitLeaks, TruffleHog — run on every commit

---

## 7. Data Testing

Verify data correctness, integrity, completeness, and pipeline reliability. (See `data-test-agent`.)

### What to test

**Schema validation**: column types, nullability, constraints, foreign keys, up AND down migrations

**Data quality**:
- Uniqueness where expected
- Referential integrity
- Value ranges (no negative ages, no future birthdates)
- Format consistency (dates, phones, emails)

**Pipeline/ETL**:
- Source-to-target record counts match (accounting for expected filtering)
- Transformation logic correctness
- Idempotency — pipeline run twice produces same result
- Late-arriving data handling
- Dead-letter behaviour

### Framework selection
Great Expectations (Python) · dbt tests (SQL) · Soda · pandera (pandas) · pytest + SQL assertions

### Principles
- Test at boundaries: empty datasets, single record, large volumes
- Test with realistic data volumes — a query that works on 100 rows may timeout on 10M
- Never use production data without anonymisation

---

## 8. Contract Testing

See `contract-testing` skill for full Pact setup. Summary:

Consumer writes what it expects → becomes a contract → provider verifies against its implementation.
Consumer drives the contract. Test only what the consumer actually uses.

---

## 9. Accessibility Testing

See `accessibility` skill for coding standards. Testing summary:

**Automated** (catches ~30–40% of issues):
- axe-core (integrates with Playwright/Cypress/Jest)
- Lighthouse (CI-runnable)
- pa11y (CLI tool)

**Manual** (required for the rest):
- Screen reader flow (NVDA on Windows, VoiceOver on Mac)
- Keyboard-only navigation
- Meaningful reading order

Minimum standard: WCAG 2.1 Level AA. Run axe-core in CI — fail the build on violations.

---

## 10. Regression Testing

Ensure new changes don't break existing functionality.

### Principles
- Every bug fix gets a test BEFORE the fix — test should fail, then pass after
- Maintain a regression suite that runs on every PR
- Prioritise regression tests for critical business flows
- A flaky regression test is worse than no test — fix or delete it immediately
- Visual regression: Percy, Chromatic, Playwright screenshots with comparison

### Strategy
- Unit + integration tests form the bulk of regression safety net
- Tag critical path tests for fast subset runs
- Track flaky test rate as a team metric

---

## 11. Architecture Testing

Enforce structural rules about code organisation, dependencies, and layering. (See `architecture-testing` skill.)

### What to enforce
- Layer dependency rules (controllers → services → repositories, never reverse)
- Package/module dependency constraints
- Circular dependency detection
- Naming conventions for classes, files, packages
- No direct SQL in controller layer, no framework imports in domain layer

### Framework selection
| Language | Tool |
|----------|------|
| Java/Kotlin | ArchUnit |
| TypeScript/JS | dependency-cruiser, eslint-plugin-import |
| Python | import-linter, pydeps |
| .NET | NetArchTest |
| Go | depguard, go-arch-lint |

---

## 12. Smoke Testing

Quick health check after every deployment. Does the system start and respond?

### What to include
- Application starts without crashing
- Health check endpoint returns 200
- Database connection works
- Key API endpoint returns a valid response
- Authentication flow completes

### Principles
- Must complete in under 2 minutes
- Run after every deployment automatically
- Failure = immediate rollback trigger
- Maximum 5–15 tests — keep it small by design

---

## 13. Chaos / Resilience Testing

Deliberately inject failures to verify graceful degradation. (See `chaos-test-agent`.)

### What to test
- Service dependency goes down — system degrades gracefully?
- Network latency spikes — timeouts fire correctly?
- Database connection pool exhaustion
- Disk full scenarios
- Clock skew between services

### Tools
Toxiproxy (network fault injection) · Litmus (Kubernetes) · Gremlin (commercial) · Chaos Monkey

### Principles
- Start in staging. Earn your way to production.
- Have a hypothesis before every experiment: "If Redis goes down, service falls back to DB and responds within 5s"
- Always have a kill switch

---

## 14. Mutation Testing

Test the quality of your test suite by introducing small bugs and checking if tests catch them. (See `mutation-test-agent`.)

### How it works
1. Tool modifies source code slightly (changes `>` to `>=`, removes a line)
2. Runs test suite against each mutant
3. Tests pass → mutant survived → gap in test suite
4. Tests fail → mutant killed → tests are solid there

### Framework selection
| Language | Tool |
|----------|------|
| JS/TS | Stryker |
| Python | mutmut, cosmic-ray |
| Java | PITest |
| C# | Stryker.NET |

### Principles
- Mutation score > 80% is a good target
- Run weekly or on critical modules — NOT every PR (slow)
- Focus on business logic — skip boilerplate and config

---

## Test Distribution: The Testing Trophy

```
         /   E2E    \         ← Few (5–20) — expensive, slow, highest confidence
        /  API/Int   \        ← Moderate — test boundaries and contracts
       /    Unit      \       ← Many — fast, cheap, test all business logic
      / Static / Lint  \      ← Automated — catches type errors and code smells
```

Starting ratio: 60% unit · 20% integration/API · 10% E2E · 10% everything else

Do NOT follow ratios dogmatically. A data pipeline project may be 80% data tests. A microservices project needs heavy contract testing. Fit the strategy to the system.

---

## Cross-Cutting Practices

### Test naming
Pattern: `should_<expected_behavior>_when_<condition>`
```
should_return_404_when_user_not_found
should_reject_transfer_when_insufficient_balance
should_retry_three_times_when_connection_timeout
```

### Test data
- Use factories/builders, not raw object literals
- Faker libraries for realistic data — use seeded randomness for reproducibility
- Never share test data across test files

### CI cadence
| Type | When to run |
|------|-------------|
| Unit + lint | Every commit |
| Integration + API | Every PR |
| E2E | Merge to main + pre-deploy |
| Performance + Security | Nightly or weekly |
| Architecture | Every PR |
| Smoke | After every deployment |
| Mutation | Weekly, on critical modules |
| Chaos | Weekly, in staging |

### Flaky test policy
A flaky test is a bug, not a nuisance. Fix it or delete it.
Quarantine immediately — do not let flaky tests erode trust in the suite.

---

## Checklist

- [ ] Decision framework applied — correct test type chosen for the task
- [ ] Unit tests cover all business logic branches
- [ ] Integration tests cover all module boundaries
- [ ] At least one smoke test per deployment
- [ ] E2E tests cover critical user journeys only
- [ ] API tests cover status codes, shapes, auth, and validation
- [ ] Regression test added before every bug fix
- [ ] Architecture tests enforce layer boundaries
- [ ] Test names describe behaviour not method names
- [ ] No `sleep()` in any test — explicit waits only
- [ ] No production data in tests without anonymisation
- [ ] CI cadence configured correctly per type
