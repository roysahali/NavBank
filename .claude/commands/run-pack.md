---
name: run-pack
description: Execute the test cases in a TESTER-PACK.md automatically — marks each PASS, FAIL, or NEEDS-HUMAN. Never modifies test expectations.
argument-hint: "[phase_number] [--tc TC-F-001]"
---

<objective>
Read the TESTER-PACK.md for the given phase and execute every test case that can be run automatically. Write results directly into the file. Mark screen reader, UX judgment, and device-specific tests as NEEDS-HUMAN. Never modify Expected Result — only fill Actual Result and Status.
</objective>

<rules>
- NEVER modify the Expected Result column — it is the spec, not the output
- NEVER mark a case PASS if the step could not be executed
- NEVER guess — if the outcome is ambiguous, mark NEEDS-HUMAN with a note
- NEVER delete or reorder test cases
- Screen reader tests are always NEEDS-HUMAN
- Keyboard-only tests require a tester — mark NEEDS-HUMAN
- Any test requiring a physical device (iOS, Android) is always NEEDS-HUMAN
</rules>

<execution>

## Step 1: Load the test pack
```bash
PHASE=${1:-$(grep "current_phase\|Phase:" .planning/STATE.md 2>/dev/null | head -1 | grep -oE '[0-9]+')}
PACK=".planning/phases/${PHASE}-TESTER-PACK.md"
FILTER="${2:-}"  # optional: --tc TC-F-001 to run a single case

[ -f "$PACK" ] || { echo "No test pack found at $PACK — run /tester-pack $PHASE first"; exit 1; }

echo "Running test pack: $PACK"
cat "$PACK" | grep "^#### TC-" | head -5
echo "..."
TOTAL=$(grep -c "^#### TC-" "$PACK" 2>/dev/null || echo 0)
echo "Total cases: $TOTAL"
```

## Step 2: Detect execution environment
```bash
# Detect app type and start app if needed
BASE_URL=$(grep -E "BASE_URL|APP_URL|localhost" CLAUDE.md 2>/dev/null | head -1 | grep -oE 'https?://[^ ]+' | head -1)
BASE_URL=${BASE_URL:-http://localhost:3000}

echo "Base URL: $BASE_URL"

# Check if app is running
curl -sf --max-time 5 "$BASE_URL" > /dev/null 2>&1 && echo "✅ App is running" || {
  echo "App not running — attempting to start..."
  npm start &>/tmp/app.log & sleep 6
  curl -sf --max-time 10 "$BASE_URL" > /dev/null 2>&1 && echo "✅ App started" || echo "⚠️ Could not start app — API-only tests will run"
}

# Detect Playwright
PLAYWRIGHT=$(npx playwright --version 2>/dev/null && echo "yes" || echo "no")
echo "Playwright available: $PLAYWRIGHT"
```

## Step 3: Execute test cases

For each test case in the pack (excluding NEEDS-HUMAN), execute using the appropriate method:

### For API test cases (TC-*-* where steps involve HTTP requests):
```bash
# Extract and run the test
# Example execution pattern for API cases:
# POST /api/auth/login with {"email":"test@example.com","password":"Test1234!"}
STATUS=$(curl -s -o /tmp/tc-response.json -w "%{http_code}" \
  -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}')
BODY=$(cat /tmp/tc-response.json)

# Compare against expected result
# Write actual result back to the pack file
```

### For UI test cases (Playwright if available):
```javascript
// Example Playwright execution for UI cases
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE_URL);
// ... execute steps from test case
// ... capture actual result
// ... compare to expected
// ... write result back
```

### For each test case, write results back to TESTER-PACK.md:

```
PASS:   Fill "Actual result: {what actually happened}"
        Set "Status: PASS"

FAIL:   Fill "Actual result: {what happened — be specific}"
        Set "Status: FAIL"
        Add "Failure detail: {error message, screenshot path, or curl response}"

NEEDS-HUMAN: Set "Status: NEEDS-HUMAN"
             Add "Reason: {why this cannot be automated — screen reader / physical device / UX judgment}"

SKIP:   Set "Status: SKIP"
        Add "Reason: {prerequisite not met — e.g. test data not available}"
```

## Step 4: Update execution log in pack

Append to the Execution Log section at the bottom of TESTER-PACK.md:

```markdown
| {run number} | {date} | /run-pack (automated) | {passed} | {failed} | {needs-human} | {skipped} |
```

## Step 5: Report results

```bash
PASS=$(grep -c "Status: PASS" "$PACK" 2>/dev/null || echo 0)
FAIL=$(grep -c "Status: FAIL" "$PACK" 2>/dev/null || echo 0)
HUMAN=$(grep -c "Status: NEEDS-HUMAN" "$PACK" 2>/dev/null || echo 0)
SKIP=$(grep -c "Status: SKIP" "$PACK" 2>/dev/null || echo 0)

echo ""
echo "══════════════════════════════════════════"
echo "  /run-pack COMPLETE"
echo "══════════════════════════════════════════"
echo "  ✅ PASS:         $PASS"
echo "  ❌ FAIL:         $FAIL"
echo "  👤 NEEDS-HUMAN:  $HUMAN"
echo "  ⏭  SKIPPED:      $SKIP"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "  ── Failed cases ──"
  grep -B5 "Status: FAIL" "$PACK" | grep "^#### TC-" | sed 's/#### /  ❌ /'
  echo ""
  echo "  Run /fix-issues to attempt auto-repair of failed cases"
  echo "  OR review failures in: $PACK"
fi

if [ "$HUMAN" -gt 0 ]; then
  echo "  ── Assign to human tester ──"
  grep -B5 "Status: NEEDS-HUMAN" "$PACK" | grep "^#### TC-" | sed 's/#### /  👤 /'
fi

echo ""
echo "  Full results: $PACK"
echo "══════════════════════════════════════════"
```

</execution>
