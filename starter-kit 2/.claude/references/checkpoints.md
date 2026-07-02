# Checkpoint Reference

## Automation-First Rule

**If Claude CAN do it via CLI/API, Claude MUST do it.**

The user should never be asked to:
- Run CLI commands
- Start or stop servers
- Run builds, tests, or migrations
- Edit configuration files
- Install packages

The user should only be asked to:
- Visit URLs and visually verify behavior
- Make decisions between implementation options
- Perform actions that genuinely require browser login with no CLI alternative
- Provide secrets/API keys (Claude then configures them via CLI)

---

## Checkpoint Types

### 1. `checkpoint:human-verify`
**Purpose:** Human confirms Claude's automated work functions correctly.
**Frequency:** End of meaningful feature chunks, not after every small task.
**Preparation:** Claude ensures environment is ready BEFORE presenting checkpoint.

```
═══════════════════════════════════════════
  CHECKPOINT: {Brief Title}
═══════════════════════════════════════════

→ YOUR ACTION: {Specific instruction}

  1. {Step 1 — visit URL, click button, etc.}
  2. {Step 2 — what to look for}

  Expected: {what it should look/behave like}

Please confirm: Does this work correctly? (yes/no)
```

### 2. `checkpoint:decision`
**Purpose:** Human makes implementation choice that affects future work.
**When:** Architecture decisions, UX choices, library selection.

```
═══════════════════════════════════════════
  DECISION: {Brief Title}
═══════════════════════════════════════════

→ YOUR ACTION: Choose an option

  A) {Option A} — {tradeoff}
  B) {Option B} — {tradeoff}
  C) {Option C} — {tradeoff}
```

### 3. `checkpoint:human-action`
**Purpose:** Action has NO CLI/API and requires human-only interaction.
**Usage:** RARE. Only for things like OAuth console setup, app store submissions, physical device testing.

```
═══════════════════════════════════════════
  ACTION REQUIRED: {Brief Title}
═══════════════════════════════════════════

→ YOUR ACTION: {What to do}

  1. {Step-by-step instructions}
  2. {What to provide back}

Let me know when complete.
```

---

## Verification Readiness

Before ANY checkpoint:human-verify, Claude must:

1. Start the dev server (if needed)
2. Verify the server responds: `curl -s http://localhost:3000 > /dev/null`
3. Run any necessary builds
4. Seed test data if the check needs it

The user should be able to immediately verify — zero setup on their end.

---

## Secret Handling

When external services require API keys:

1. Claude asks for the secret value + provides link to where user can get it
2. User provides the value
3. Claude configures it via CLI (`vercel env add`, `.env` file, etc.)
4. Claude verifies the configuration works

Users never manually edit configuration files.

---

## Anti-Patterns

| Wrong | Why | Correct |
|-------|-----|---------|
| "Run `npm install` and then `npm run dev`" | Claude can do this | Claude runs both commands |
| "Open your browser and go to..." (after every small change) | Verification fatigue | Group verifications at meaningful milestones |
| "Deploy to Vercel" | Vercel has CLI | Claude runs `vercel --yes` |
| "Check if it works" | Not specific | "Visit /register, fill form, submit — expect redirect to /dashboard" |
| "Set up your database" | Too vague | Claude runs migrations + verifies connection |
