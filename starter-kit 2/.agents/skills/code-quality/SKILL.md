# SKILL.md — Code Quality

## Overview
Standards for passing quality gates using free, stack-appropriate static analysis tools. SonarQube is optional — the kit detects your tech stack and runs the right tools automatically. Apply whenever writing or reviewing code.

---

## Tool Selection by Tech Stack

The quality gate detects your stack and selects tools automatically. No configuration needed for the defaults.

### JavaScript / TypeScript
| Tool | Catches | Install |
|------|---------|---------|
| ESLint | Style, patterns, potential bugs | `npm install -D eslint` |
| TypeScript compiler | Type errors | `npm install -D typescript` |
| Biome | Lint + format combined (if configured) | `npm install -D @biomejs/biome` |
| Knip | Unused exports, dead code | `npm install -D knip` |
| CodeQL | Security + logic errors | Free via GitHub Action |
| Semgrep | OWASP patterns, custom rules | Free tier, no install |

### Python
| Tool | Catches | Install |
|------|---------|---------|
| Ruff | Lint + format (replaces Flake8+isort+Black) | `pip install ruff` |
| Mypy | Type checking | `pip install mypy` |
| Pylint | Code quality, errors, conventions | `pip install pylint` |
| Bandit | Python-specific security issues | `pip install bandit` |
| Vulture | Dead code | `pip install vulture` |
| CodeQL | Security + logic errors | Free via GitHub Action |

### Java / Kotlin
| Tool | Catches | Config |
|------|---------|--------|
| Checkstyle | Style and conventions | `mvn checkstyle:check` |
| SpotBugs | Bug patterns | `mvn spotbugs:check` |
| PMD | Code smells, unused code | `mvn pmd:check` |
| ErrorProne | Common mistakes at compile time | Maven compiler plugin |
| CodeQL | Security + logic errors | Free via GitHub Action |

### Go
| Tool | Catches | Install |
|------|---------|---------|
| golangci-lint | 100+ linters in one | `go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest` |
| go vet | Built-in suspicious constructs | Built-in |
| staticcheck | Bugs, performance, style | `go install honnef.co/go/tools/cmd/staticcheck@latest` |

### Rust
| Tool | Catches | Command |
|------|---------|---------|
| cargo clippy | Lints and suggestions | `cargo clippy -- -D warnings` |
| cargo check | Compilation errors | `cargo check` |

### Ruby
| Tool | Catches | Install |
|------|---------|---------|
| RuboCop | Style and conventions | `gem install rubocop` |
| Brakeman | Security (Rails) | `gem install brakeman` |

### C# / .NET
| Tool | Catches | Command |
|------|---------|---------|
| dotnet format | Style and formatting | `dotnet format --verify-no-changes` |
| Roslyn analyzers | Bugs and patterns | Built into dotnet build |

---

## Universal Tools (run on all stacks)

### CodeQL — free, catches real bugs
CodeQL finds logic errors and security vulnerabilities that linters miss. Free on GitHub for all repo types via the CodeQL Action. No token or server needed.

```yaml
# GitHub Actions — add to quality gate job
- uses: github/codeql-action/init@v3
  with:
    languages: javascript  # or: python, java, go, ruby, csharp
- uses: github/codeql-action/analyze@v3
```

For GitLab or non-GitHub CI:
```bash
# Install CodeQL CLI
# https://github.com/github/codeql-action/releases
codeql database create /tmp/codeql-db --language=javascript --source-root=.
codeql analyze /tmp/codeql-db --format=sarif-latest --output=results.sarif
```

### Semgrep — free tier, OWASP rules
```bash
semgrep --config auto .                    # auto-detect language + rules
semgrep --config p/owasp-top-ten .        # OWASP Top 10 check
semgrep --config p/javascript .            # JS-specific rules
semgrep --config p/python .               # Python-specific rules
```

---

## SonarQube / SonarCloud — Optional Enhancement

SonarQube adds a unified dashboard, trend tracking, and quality gate history across projects. It is NOT required — the tools above provide equivalent coverage for free.

**When SonarQube makes sense:**
- Team already has a SonarQube server running
- Want a single dashboard across many projects
- Need historical trend tracking over time

**SonarCloud free tier:**
- Public repos: free, unlimited
- Private repos: paid (use CodeQL + language linters instead)

```bash
# Only runs if SONAR_TOKEN is set — otherwise skipped
if [ -n "$SONAR_TOKEN" ]; then
  sonar-scanner \
    -Dsonar.projectKey=${PROJECT_KEY} \
    -Dsonar.host.url=${SONAR_HOST_URL} \
    -Dsonar.token=${SONAR_TOKEN}
fi
```

---

## Quality Thresholds (apply regardless of tool)

| Metric | FAIL | WARN |
|--------|------|------|
| Critical violations | > 0 | — |
| Major violations | > 5 | > 2 |
| Coverage drop | > 5% | > 2% |
| Cyclomatic complexity per function | > 10 | > 7 |
| Duplication increase | > 3% | > 1% |

---

## Code Quality Rules (stack-agnostic)

### Functions
- Max length: 50 lines
- Max nesting depth: 3 levels
- Max parameters: 4 (use object/dict if more needed)
- Max cyclomatic complexity: 10

### Duplication
If the same logic appears in 2+ places → extract to shared utility

### Code smells — never commit these
- Magic numbers without named constants
- Dead/commented-out code blocks
- TODO without a ticket reference
- Empty catch/except blocks
- `console.log` / `print` debug statements in production code

---

## Checklist

- [ ] Stack detected and correct tools selected
- [ ] No critical violations from any tool
- [ ] TypeScript/mypy/type checking passes with no errors
- [ ] No functions exceeding 50 lines
- [ ] No nesting deeper than 3 levels
- [ ] No dead code or debug statements
- [ ] Coverage has not dropped
- [ ] CodeQL / Semgrep run (at minimum one of these)
- [ ] SonarQube run only if SONAR_TOKEN is configured
