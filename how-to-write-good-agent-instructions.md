AGENTS.md is basically “system prompt-as-code” for your repo, so the goal is: **give agents the same mental model a senior dev would have after 1–2 weeks on the project, in a format they can reliably parse and obey.**

Below are practical guidelines and an opinionated template you can drop into your projects.

---

## 1. Have the right mental model

AGENTS.md is a **README for agents**: a predictable place for build commands, test workflows, conventions, and guardrails that would clutter a human-facing README. ([GitHub][1])

A few design goals:

* **Single source of truth for agents** – instead of `.cursorrules`, `.copilot-instructions.md`, `.builderrules` all diverging, keep project-wide rules in AGENTS.md and have tool-specific files just point to it. ([Builder.io][2])
* **Cross-tool** – AGENTS.md is understood by a growing ecosystem (Copilot agents, Cursor, Aider, Gemini CLI, etc.). ([Factory][3])
* **Complement, don’t duplicate, README** – README stays focused on humans; AGENTS.md holds the nitty-gritty: exact commands, style rules, and agent-specific safety constraints. ([Factory][3])

Think: “If an AI joins our team, what are the minimum instructions that make it productive and safe?”

---

## 2. Core sections every good AGENTS.md should have

Drawing from the official spec, examples like rsyslog’s AGENTS.md, and GitHub’s analysis of 2.5k+ agent files, effective instructions consistently cover **six areas**: commands, testing, project structure, code style, git workflow, and boundaries. ([The GitHub Blog][4])

### 2.1 Project overview (short and concrete)

Keep this **tight**, but give the agent enough to know what kind of repo it’s in.

Include things like:

* Primary languages & frameworks:

  * `TypeScript`, `React 18`, `Node 20`, `pnpm`, etc.
* Build system & runtime:

  * `Vite` vs `Next.js`, monorepo tooling (`turbo`, `nx`, etc.)
* High-level structure:

  * “Monorepo with apps in `apps/*` and shared libs in `packages/*`.”

You can mirror rsyslog’s style, which starts with a concise “Repository Overview” listing primary language, build system, module layout, docs location, etc. ([rsyslog github mirror][5])

### 2.2 Commands (put near the top)

GitHub’s analysis shows **successful AGENTS.md files put executable commands early**, with exact flags. ([The GitHub Blog][4])

Have a section like:

* **Install deps:** `pnpm install`
* **Dev server:** `pnpm dev`
* **Lint:** `pnpm lint`
* **Unit tests:** `pnpm test`
* **Single-file commands** (highly recommended): typecheck, lint, format single file / path. ([Builder.io][2])

This lets the agent run **cheap, targeted checks** instead of spamming full builds. ([Builder.io][2])

### 2.3 Testing workflow

Make it painfully clear what “done” means:

* Required test commands before commits/PRs
* Where tests live (`tests/`, `__tests__`, etc.)
* How to run:

  * whole suite vs important smoke tests
  * per-file tests (e.g. `npm run vitest run path/to/file.test.tsx`) ([Builder.io][2])
* Expectation: “If you change behavior, add or update tests.” ([note（ノート）][6])

### 2.4 Project structure & key paths

Agents do read the tree, but **you save tokens and mistakes by telling them what matters**:

* `apps/web` – React front-end (only read from `/src`, write to `/src` and `/tests`)
* `packages/core` – shared game logic (business rules live here)
* `packages/ui` – design system; prefer these components over raw HTML

rsyslog’s AGENTS.md shows a good pattern: overview + “Quick links” to other AGENTS.md files and key docs. ([rsyslog github mirror][5])

### 2.5 Code style & examples

GitHub’s study and prompt-engineering guides all stress: **examples beat prose**. ([The GitHub Blog][4])

* Define naming conventions (functions, classes, constants, file names). ([The GitHub Blog][4])
* Link or summarize lint/format rules (`.editorconfig`, `.prettierrc`, `.eslintrc`…).
* Show 1–2 **“good vs bad”** code snippets in your main language:

  * good: descriptive names, error handling, consistent style
  * bad: vague names, missing checks, inconsistent style ([The GitHub Blog][4])

The agent will pattern-match on these examples more reliably than on abstract “use clean code” statements.

### 2.6 Git & workflow rules

Tell agents how to behave as “team members”:

* Default base branch and merge target. ([rsyslog github mirror][5])
* Branch naming (especially for AI-generated branches). ([rsyslog github mirror][5])
* Commit message style:

  * length limits
  * prefix formats (`type(scope): summary`)
  * references to issues/PRs
* Whether they should **open PRs or push directly** (usually “open PR, never push to main”). ([rsyslog github mirror][5])

rsyslog’s file is a good reference for this kind of policy. ([rsyslog github mirror][5])

### 2.7 Safety, boundaries, and permissions

This is where you say **what not to do**—one of the most important parts according to GitHub & Builder. ([The GitHub Blog][4])

Consider breaking into:

* ✅ **Always allowed without asking**

  * read/list files
  * run single-file typecheck/lint/format
* ⚠️ **Ask first**

  * installing new packages
  * changing DB schema / migrations
  * modifying CI/CD, infra, or deployment configs
* 🚫 **Never**

  * commit secrets or generated API keys
  * edit `node_modules/`, `dist/`, vendored or generated code
  * run destructive commands (`rm -rf`, `chmod` on random paths, etc.)

OpenSSF’s security guidance for AI code assistants strongly encourages **explicit constraints** and secure defaults in prompts/instructions; AGENTS.md is a perfect place for that. ([openssf.org][7])

### 2.8 Task guidance & “when stuck” rules

Builder’s article shows how much value you get from **simple task recipes** and “escape hatches” for the agent. ([Builder.io][2])

Examples:

* For **small bugfixes**:

  * locate file & tests
  * write a minimal fix
  * update tests if necessary
  * run per-file checks
* For **refactors**:

  * propose a short plan first (bullets)
  * keep diffs small and incremental
* When unsure:

  * “If you’re stuck, ask a clarifying question or propose a plan instead of making large speculative changes.” ([Builder.io][2])

This dramatically reduces “agent goes rogue and rewrites half the repo” incidents.

### 2.9 Monorepos & nested AGENTS.md

AGENTS.md supports **hierarchical rules**: tools typically load the *nearest* AGENTS.md in the directory tree. ([note（ノート）][6])

Patterns:

* Root `AGENTS.md` – global rules (security, generic commands, org-wide style).
* Per-package `AGENTS.md` – local stack/version rules (e.g. React 17 in legacy package vs React 18 in new one). ([note（ノート）][6])
* Optional “quick links” from root to subtree AGENTS.md files, like rsyslog’s setup (`doc/AGENTS.md`, `plugins/AGENTS.md`, etc.). ([rsyslog github mirror][5])

This keeps guidance precise without one giant, conditional-ridden file.

---

## 3. Writing style: think prompt-engineering, not documentation

A lot of AGENTS.md advice is just **prompt best practices, codified**. ([GitHub Docs][8])

### 3.1 Be specific and narrow

GitHub’s analysis: successful files give agents **a specific job** (“test engineer who writes Jest tests and never touches app code”) instead of generic “helpful assistant” fluff. ([The GitHub Blog][4])

* Use direct, imperative language: “Do X”, “Never do Y”.
* State your stack and versions explicitly (“React 18 + Vite + Tailwind CSS”), not just “React app”. ([The GitHub Blog][4])

### 3.2 Prefer bullets and checklists over paragraphs

Most tools ignore whitespace but still do better with **short bullets and headings**. ([GitHub Docs][9])

Good patterns:

* titled sections (`### Commands`, `### Safety`, `### Do / Don't`)
* short bullets with one idea each
* structured lists of commands and boundaries

### 3.3 Use “Do / Don’t” lists

Builder’s guide shows **simple Do/Don’t lists** are incredibly high-leverage: they encode your nitpicks (“use mobx, not useState”, “do not hardcode colors”) in a way the agent can easily follow. ([Builder.io][2])

* **Do**: specify libraries, patterns, and defaults.
* **Don’t**: add heavy deps, bypass design tokens, ignore certain tests, etc.

### 3.4 Include concrete examples & constraints

Prompt-engineering guides and GitHub’s template stress:
**“Code examples over explanations.”** ([The GitHub Blog][4])

* Show 1–2 canonical snippets (good/bad).
* Show canonical CLI commands (esp. single-file variants).
* Add constraints like “keep diffs small”, “avoid project-wide rewrites unless asked”. ([Builder.io][2])

### 3.5 Iterate based on real failures

Most sources emphasize **trial and error**: run agents, see what they mess up, and add rules to AGENTS.md to prevent repeats. ([Builder.io][2])

Treat AGENTS.md as a living document:

* each recurring mistake → new bullet in Do/Don’t or Safety
* keep it small; prune obsolete rules regularly

---

## 4. Common anti-patterns to avoid

From the spec, case studies, and real AGENTS.md examples: ([note（ノート）][6])

1. **Vague persona**

   * “You are a helpful coding assistant” → useless.
   * Fix: “You are a TypeScript test engineer; you only edit files in `tests/` and `src/` and always run `pnpm test` on related files.”

2. **No commands or test instructions**

   * Agent guesses and runs expensive or wrong commands.
   * Fix: put commands near the top, including per-file variants.

3. **No boundaries / safety**

   * Agent installs random packages, edits infra, or touches secrets.
   * Fix: explicit ✅/⚠️/🚫 lists.

4. **Huge walls of text**

   * Agent may only partially parse instructions; humans won’t maintain them.
   * Fix: keep sections short; rely on bullets and examples.

5. **Conflicting instructions across files**

   * README, AGENTS.md, `.cursorrules`, `.github/copilot-instructions.md` disagree.
   * Fix: **centralize rules in AGENTS.md**, and in tool-specific files just say “Follow AGENTS.md”. ([Builder.io][2])

---

## 5. Opinionated AGENTS.md template

Here’s a generic template you can adapt. It follows patterns recommended by the official spec, GitHub’s starter template, and real-world best practices. ([GitHub][1])

````markdown
# AGENTS.md – Repository agent guide

## Project overview
- Language / stack: TypeScript, React 18, Node 20, pnpm monorepo
- Build system: Vite for web apps, Node for backend services
- Layout:
  - `apps/web` – main frontend app
  - `apps/api` – backend API
  - `packages/core` – shared business logic
  - `packages/ui` – design system and shared UI components

## Commands (use these before inventing your own)
- Install deps: `pnpm install`
- Dev server (web): `pnpm --filter apps/web dev`
- Dev server (api): `pnpm --filter apps/api dev`
- Run tests (all): `pnpm test`
- Lint all: `pnpm lint`

### File-scoped commands (preferred)
- Typecheck a file: `pnpm tsc --noEmit path/to/file.ts`
- Format a file: `pnpm prettier --write path/to/file.tsx`
- Lint a file: `pnpm eslint --fix path/to/file.tsx`
- Test a file: `pnpm vitest run path/to/file.test.tsx`

> Prefer file-scoped commands for quick feedback. Only run repo-wide builds/tests if explicitly asked.

## Testing expectations
- Any behavior change should have tests updated or added.
- Unit tests live next to source: `*.test.ts[x]`.
- Before creating a PR:
  - Run relevant file-scoped tests.
  - For larger changes, run `pnpm test` at least once.

## Project structure (what to read / what to edit)
- `apps/web/src` – React app; you may read and edit components and hooks here.
- `apps/api/src` – API routes, controllers, data access.
- `packages/core/src` – core domain logic; prefer adding new rules here over duplicating logic.
- `packages/ui/src` – shared UI components; prefer these over raw HTML.
- `docs/` – documentation; you may update docs that correspond to code you change.

## Coding style
- Use existing ESLint/Prettier configuration. Do not override it.
- Naming:
  - functions & variables: `camelCase`
  - React components & classes: `PascalCase`
  - constants: `UPPER_SNAKE_CASE`
- Prefer small, focused modules over large files.

### TypeScript style example

```ts
// ✅ Good: explicit types, error handling, clear naming
export async function fetchUserById(id: string): Promise<User> {
  if (!id) throw new Error("User ID is required");
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// ❌ Bad: vague names, no validation, weak typing
export async function get(x) {
  return (await api.get("/users/" + x)).data;
}
````

## Git & workflow

* Base branch: `main`
* Branch naming:

  * features: `feat/<short-description>`
  * bugfixes: `fix/<short-description>`
  * AI-generated: prefix with tool name, e.g. `agent-fix/game-dealing-bug`
* Before opening a PR:

  * Run relevant tests and lint commands.
  * Keep diffs as small and focused as possible.

## Safety & boundaries

### Always allowed

* Read and list files in this repository.
* Run file-scoped typecheck, lint, format, and test commands.

### Ask first

* Installing or removing dependencies (`package.json`, lockfiles).
* Changing database schemas, migrations, or infra configuration.
* Editing CI/CD workflows or deployment files.

### Never

* Commit secrets, tokens, or credentials (even in tests or examples).
* Edit `node_modules/`, `dist/`, or generated files.
* Run destructive shell commands (`rm -rf`, `chmod` on arbitrary paths).

## Task guidance

### Small bugfixes

1. Identify the minimal file(s) to change.
2. Locate or add targeted tests.
3. Apply a minimal fix.
4. Run file-scoped tests and linters.

### Refactors

1. Propose a short plan in bullets.
2. Execute the refactor in small, reviewable steps.
3. Keep existing behavior unless explicitly asked to change it.

### When stuck

* Ask a clarifying question or propose a plan instead of guessing.
* Do not perform large speculative refactors without confirmation.

## Security & privacy

* Treat all code and configuration as private unless explicitly documented otherwise.
* Do not connect to external services or APIs beyond those already used in the codebase without explicit instruction.
* Follow least-privilege principles when handling tokens, keys, or credentials.

```

You can then:

- Add **package-specific AGENTS.md** files under `apps/` and `packages/` to override stack details and commands for each sub-project. :contentReference[oaicite:37]{index=37}  
- Point `.github/copilot-instructions.md`, `.cursorrules`, `CLAUDE.md`, etc. at `./AGENTS.md` so every tool shares the same rules. :contentReference[oaicite:38]{index=38}  

If you’d like, next step I can sketch an AGENTS.md **specifically tailored to your poker project repo** (monorepo layout, TS/React, game rules, test strategy, MCP servers, etc.) so you can just drop it in.
::contentReference[oaicite:39]{index=39}
```

[1]: https://github.com/openai/agents.md "GitHub - openai/agents.md: AGENTS.md — a simple, open format for guiding coding agents"
[2]: https://www.builder.io/blog/agents-md "Improve your AI code output with AGENTS.md (+ my best tips)"
[3]: https://docs.factory.ai/cli/configuration/agents-md "AGENTS.md - Factory Documentation"
[4]: https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/ "How to write a great agents.md: Lessons from over 2,500 repositories - The GitHub Blog"
[5]: https://github-mirror.rsyslog.com/rsyslog/rsyslog/src/commit/3935fc95758caeea81cdb4769ba2ebf5824b567d/AGENTS.md "rsyslog/AGENTS.md at 3935fc95758caeea81cdb4769ba2ebf5824b567d - rsyslog - rsyslog github mirror"
[6]: https://note.com/npaka/n/nd1258df2853c "AGENTS.md の概要｜npaka"
[7]: https://openssf.org/blog/2025/09/16/new-openssf-guidance-on-ai-code-assistant-instructions/?utm_source=chatgpt.com "New OpenSSF Guidance on AI Code Assistant Instructions"
[8]: https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering?utm_source=chatgpt.com "Prompt engineering for GitHub Copilot Chat"
[9]: https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot "Adding repository custom instructions for GitHub Copilot - GitHub Docs"
