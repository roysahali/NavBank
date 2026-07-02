---
name: init
description: The very first command to run in any project. Reads your scope document and creates CLAUDE.md — the project brain file that all agents depend on.
argument-hint: "[path/to/scope-doc] [--rearchitect <old-system-path>]"
---

<objective>
Create CLAUDE.md for this project by reading the scope document (or asking questions if none exists). This must run before /new-project, /bootstrap-kit, or any other command. Nothing works correctly without CLAUDE.md.

Special mode: if --rearchitect <path> is passed, the old codebase at that path IS the scope. Claude reads it to build CLAUDE.md instead of looking for a scope document.
</objective>

<rearchitect_mode>
If `--rearchitect <old-system-path>` argument is present:

1. Confirm old system path exists: `test -d {OLD_SYSTEM_PATH}`
2. Read the old system to extract project context:
   ```bash
   cat {OLD_SYSTEM_PATH}/README.md 2>/dev/null | head -60
   cat {OLD_SYSTEM_PATH}/package.json 2>/dev/null | head -20
   find {OLD_SYSTEM_PATH} -name "*.md" | grep -v node_modules | head -5 | xargs cat 2>/dev/null
   ```
3. Ask the user:
   - "What new tech stack will you use for the rebuilt system?"
   - "Any enhancements beyond feature parity?"
   - "Any timeline or team size constraints?"
4. Create CLAUDE.md with a re-architecture specific structure (see template below)
5. Skip the standard scope document search — proceed directly to CLAUDE.md creation

Re-architecture CLAUDE.md template additions:
```markdown
## Project Type
RE-ARCHITECTURE — rebuilding [project name] with new tech stack.
Old system reference: {OLD_SYSTEM_PATH} (read-only, never modify)

## Re-Architecture Rules
1. Old code is reference only — extract WHAT it does, never copy HOW
2. Parity tests must be written BEFORE implementation in Phase 4
3. Enhancements go in Phase 5 only — never mixed into Phase 4
4. Run /audit-codebase {OLD_SYSTEM_PATH} for Phase 1 (not /new-project)
```
</rearchitect_mode>

<pre_check>
Check if CLAUDE.md already exists:
```bash
test -f CLAUDE.md && echo "EXISTS" || echo "NOT_FOUND"
```
If EXISTS: Tell the user CLAUDE.md already exists. Show its contents and ask:
- "Run /init anyway to regenerate it from your scope doc?"
- "Or proceed to /new-project since CLAUDE.md is already set up?"

Stop and wait for their answer before proceeding.

Check what files are in this folder:
```bash
ls -la
find . -maxdepth 2 -name "*.pdf" -o -name "*.md" -o -name "*.txt" -o -name "*.docx" | grep -v ".claude" | grep -v ".agents" | grep -v "node_modules"
```
</pre_check>

<execution>

## Step 1: Find or Ask for the Scope Document

Check if a scope document was passed as an argument. If yes, use it.

If no argument was given, check what document files exist in the project folder:
```bash
find . -maxdepth 2 \( -name "*.pdf" -o -name "*.md" -o -name "*.txt" -o -name "*.docx" \) \
  | grep -v ".claude" | grep -v ".agents" | grep -v "node_modules" | grep -v "README"
```

If document files are found, ask:
> "I found these files: [list]. Which one is your scope/PRD document? Or type the path manually."

If no document files are found, ask:
> "I don't see a scope document in this folder. You can:
> 1. Paste the path to your scope doc
> 2. Tell me about the project and I'll create CLAUDE.md from your description
> 
> Which do you prefer?"

Wait for the user's response before continuing.

## Step 2: Read the Scope Document

Once you have the file path, read it fully:
```bash
cat {scope-file-path}
```

For PDF files, extract text:
```bash
pdftotext {scope-file-path} - 2>/dev/null || cat {scope-file-path}
```

Read the full content. Do not summarize yet — absorb everything.

## Step 3: Extract Key Information

From the scope document, extract:

1. **Project name** — The actual name of what's being built
2. **What it does** — Core purpose in 1-2 sentences
3. **Tech stack** — Every technology, framework, language, database, hosting mentioned
4. **Key features** — The main things it must do (list, not paragraph)
5. **Integrations** — Third-party services, APIs, tools
6. **Constraints** — Budget, timeline, team size, non-negotiables
7. **Out of scope** — Things explicitly NOT being built
8. **Target users** — Who will use this

If any of these are unclear or missing from the document, ask the user:
> "A few things weren't clear in the scope doc:
> - [missing item 1]
> - [missing item 2]
> Can you fill these in quickly?"

Wait for their answers.

## Step 4: Write CLAUDE.md

Create `CLAUDE.md` in the project root with this exact structure:

```markdown
# {Project Name}

## What This Project Is
{1-2 sentence description of what is being built and for whom}

## Tech Stack
{List every technology with specifics — not just "React" but "React 18 + TypeScript 5 + Vite"}
- Frontend: {framework, version, key libraries}
- Backend: {language, framework, version}
- Database: {type, version, ORM if any}
- Auth: {service or approach}
- Hosting: {platform}
- Key integrations: {list}

## Core Features (v1 Scope)
{Numbered list of the main features from the scope doc}
1. {Feature}
2. {Feature}
...

## Out of Scope
{Things explicitly NOT being built in this version}
- {item}
- {item}

## Constraints
- Timeline: {if mentioned}
- Team: {if mentioned}
- Budget: {if mentioned}
- Must use: {any mandatory technology or service}
- Must NOT use: {any exclusions}

## Coding Standards
Follow the skills in `.agents/skills/` for all conventions.
Key rules until project-specific skills are created:
- Prefer explicit over clever
- Every function needs a clear name that describes what it does
- No secrets or credentials in code — always use environment variables
- Write tests for business logic

## Common Commands
{Fill this in as the project develops. Examples:}
<!-- 
npm install        # Install dependencies
npm run dev        # Start dev server
npm run test       # Run tests
npm run build      # Production build
-->
Update this section as you discover the actual commands for this project.

## Agents Available

### Core Agents (always available)
- `planner` — Creates execution plans
- `plan-checker` — Validates plans before execution
- `executor` — Implements plans with atomic commits
- `verifier` — Checks real outcomes against requirements
- `debugger` — Scientific debugging with hypothesis testing
- `researcher` — Investigates approaches before building
- `research-synthesizer` — Merges parallel research
- `codebase-mapper` — Maps existing codebase architecture
- `roadmapper` — Creates phased roadmaps from requirements
- `kit-builder` — Creates new agents and skills for this project

### Project-Specific Agents
{This section will be populated by /bootstrap-kit}

## Skills Available

### Core Skills (always available)
- `.agents/skills/testing/` — Testing standards
- `.agents/skills/security/` — Security rules
- `.agents/skills/code-style/` — Code style conventions
- `.agents/skills/api-design/` — API design patterns
- `.agents/skills/error-handling/` — Error handling rules
- `.agents/skills/documentation/` — Documentation standards
- `.agents/skills/git-conventions/` — Git commit conventions
- `.agents/skills/agent-creator/` — How to create new agents and skills

### Project-Specific Skills
{This section will be populated by /bootstrap-kit}

## Development Workflow

```
/init              ← YOU ARE HERE (done after this command)
/new-project       ← Create .planning/ with requirements + roadmap
/bootstrap-kit     ← Create project-specific agents + skills
/discuss-phase N   ← Capture decisions for phase N
/plan-phase N      ← Research + create plans for phase N
/execute-phase N   ← Implement phase N
/verify-work N     ← Verify phase N outcomes
/audit-milestone   ← Check all requirements are met
```

## Project State
See `.planning/STATE.md` for current status (created by /new-project).

## Source Document
Scope derived from: {scope-file-name}
Initialized: {today's date}
```

Write this file now:
```bash
cat > CLAUDE.md << 'HEREDOC'
{filled-in content from above}
HEREDOC
```

## Step 5: Confirm with the User

Show the user the created CLAUDE.md:
```bash
cat CLAUDE.md
```

Say:
> "CLAUDE.md is created. A few things to confirm:
> 1. Does the tech stack look right?
> 2. Are the core features complete?
> 3. Anything missing or wrong?
>
> You can edit CLAUDE.md directly anytime — it's just a text file."

Wait for their feedback. Apply any corrections they give.

## Step 6: Commit

```bash
git init 2>/dev/null || true
git add CLAUDE.md
git commit -m "docs: initialize CLAUDE.md from scope document"
```

## Step 7: Report and Guide to Next Step

```
══════════════════════════════════════════
  INIT COMPLETE
══════════════════════════════════════════

✅ CLAUDE.md created and committed

Claude Code will now read this file at the start of
every session — your project context is persistent.

Your next steps:

  /new-project        ← Create requirements + roadmap
                         (answer 4 questions, takes ~2 min)

  Then after that:

  /bootstrap-kit      ← Auto-create agents + skills
                         tailored to your tech stack

Run /new-project now to continue.
══════════════════════════════════════════
```

</execution>
