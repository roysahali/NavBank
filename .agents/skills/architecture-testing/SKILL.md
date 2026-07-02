# SKILL.md — Architecture Testing

## Overview
Rules for enforcing structural constraints in code — layer dependencies, module boundaries, circular dependency prevention, naming conventions. Apply when setting up a new project or when architectural drift is detected. Architecture tests catch structural rot early and cheaply.

---

## What Architecture Tests Enforce

### Layer dependency rules
Code must only call downward through layers — never upward or sideways:

```
Controllers / Routes
      ↓  (can call)
Services / Use Cases
      ↓  (can call)
Repositories / Data Access
      ↓  (can call)
Domain Models / Entities
```

✅ Service calls Repository — allowed
❌ Repository imports Service — violation
❌ Domain model imports Controller — violation
❌ Framework imports in domain layer — violation

### Module boundary rules
Define which modules may import which others. Common patterns:

```
auth/     → can import shared/, cannot import payments/ or orders/
payments/ → can import auth/, shared/ — cannot import orders/
orders/   → can import auth/, payments/, shared/
shared/   → cannot import any domain module
```

### Circular dependency detection
A imports B which imports A = circular. These cause: runtime errors in some languages, test isolation failures, hard-to-understand code.

---

## Framework Selection by Language

### Java / Kotlin — ArchUnit
```java
@Test
void services_should_not_depend_on_controllers() {
    JavaClasses classes = new ClassFileImporter().importPackages("com.example");
    noClasses().that().resideInAPackage("..service..")
        .should().dependOnClassesThat()
        .resideInAPackage("..controller..")
        .check(classes);
}

@Test
void domain_should_not_use_spring_annotations() {
    JavaClasses classes = new ClassFileImporter().importPackages("com.example.domain");
    noClasses().should().beAnnotatedWith(Service.class)
        .orShould().beAnnotatedWith(Repository.class)
        .check(classes);
}
```

### TypeScript / JavaScript — dependency-cruiser
```javascript
// .dependency-cruiser.js
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies cause unpredictable behaviour',
      from: {},
      to: { circular: true }
    },
    {
      name: 'no-domain-to-framework',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { path: '^src/(controllers|routes|middleware)/' }
    },
    {
      name: 'no-cross-module',
      severity: 'warn',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/([^/]+)/',
        pathNot: '^src/modules/$1/'  // different module
      }
    }
  ]
};
```

Run: `npx depcruise --validate .dependency-cruiser.js src`

### Python — import-linter
```ini
# setup.cfg
[importlinter]
root_packages = myapp

[importlinter:contract:layers]
name = Domain layer must not import infrastructure
type = layers
layers =
    myapp.api
    myapp.services
    myapp.domain
    myapp.infrastructure
```

Run: `lint-imports`

### .NET — NetArchTest
```csharp
[Test]
public void Domain_Should_Not_Reference_Infrastructure() {
    var result = Types.InAssembly(typeof(Domain.Entity).Assembly)
        .Should().NotHaveDependencyOn("Infrastructure")
        .GetResult();
    Assert.IsTrue(result.IsSuccessful);
}
```

### Go — depguard
```yaml
# .depguard.yaml
rules:
  domain:
    files: ["**/domain/**/*.go"]
    deny:
      - pkg: "net/http"
        desc: "Domain must not import HTTP packages"
      - pkg: "database/sql"
        desc: "Domain must not import database packages"
```

---

## Naming Convention Enforcement

### TypeScript / ESLint
```javascript
// .eslintrc.js
rules: {
  // Enforce file naming conventions
  'unicorn/filename-case': ['error', { case: 'kebabCase' }],

  // No default exports (hard to rename, bad for refactoring)
  'import/no-default-export': 'error',

  // Services must be suffixed
  '@typescript-eslint/naming-convention': [
    'error',
    { selector: 'class', suffix: ['Service', 'Repository', 'Controller', 'Handler'] }
  ]
}
```

### Java — Checkstyle
```xml
<module name="RegexpSinglelineJava">
  <property name="format" value="class\s+\w+(?<!Service|Repository|Controller|Handler)\s+\{"/>
  <property name="message" value="Class must be suffixed with Service, Repository, Controller, or Handler"/>
</module>
```

---

## CI Integration

Architecture tests must run on every PR — they are fast (< 30s) and enforce constraints that would otherwise take weeks to detect:

```yaml
# GitHub Actions
- name: Architecture tests
  run: |
    npx depcruise --validate .dependency-cruiser.js src
    # OR
    mvn test -Dtest=ArchitectureTest
    # OR
    lint-imports
```

---

## Checklist

- [ ] Layer dependency rules defined (controller → service → repository → domain)
- [ ] Architecture tests run in CI on every PR
- [ ] Circular dependencies detected and reported as errors (not warnings)
- [ ] Module boundary rules defined for cross-module imports
- [ ] Framework/infrastructure imports forbidden in domain layer
- [ ] Naming conventions enforced (suffix rules for Services, Repositories, etc.)
- [ ] Violations are build failures, not warnings
- [ ] Each rule has a comment explaining WHY it exists
