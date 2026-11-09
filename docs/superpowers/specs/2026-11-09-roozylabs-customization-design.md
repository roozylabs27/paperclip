# Roozylabs Fork Customization & Upstream Synchronization Architecture

- **Project:** Paperclip Fork for Roozylabs
- **Origin Repo:** `git@github.com:roozylabs27/paperclip.git`
- **Upstream Repo:** `https://github.com/paperclipai/paperclip.git`
- **Date:** 2026-11-09
- **Status:** Approved Design

---

## 1. Overview & Objectives

Roozylabs requires a customized deployment of Paperclip (an AI agent orchestration platform) tailored with:
1. **UI & Branding Customization:** Roozylabs theme, logo, metadata, and custom styling.
2. **Antigravity CLI Adapter:** Support for running agents powered by Google Antigravity CLI (`agy`) alongside Claude Code and other agent runners.
3. **Custom Skills & Integrasi:** Roozylabs-specific workspace tools and skills.
4. **Seamless Upstream Synchronization:** The ability to pull ongoing bug fixes, security patches, and new features from the official `paperclipai/paperclip` repository with near-zero merge conflicts.

---

## 2. Git Remote & Branching Architecture

To prevent merge conflict fatigue, branch responsibilities are strictly isolated:

```
[Upstream: paperclipai/paperclip]
              │
              ▼ (git fetch upstream)
[Local 'master' branch] ─────────────► [Origin: roozylabs27/paperclip (master)]
              │
              ▼ (git merge master)
[Local 'roozy-main' branch] ─────────► [Origin: roozylabs27/paperclip (roozy-main)]
              ▲
              │ (PR merge)
[Feature branch: roozy/<feature>]
```

### Remote Definitions
* **`origin`**: `git@github.com:roozylabs27/paperclip.git` (Roozylabs fork)
* **`upstream`**: `https://github.com/paperclipai/paperclip.git` (Official Paperclip repository)

### Branch Roles & Policies
1. **`master` (Upstream Mirror Branch):**
   * Mirrors `upstream/master` 1:1.
   * **Rule:** Never commit custom Roozylabs code directly to `master`. Only update via fast-forward merges from `upstream/master`.
2. **`roozy-main` (Production & Default Branch):**
   * Acts as the primary base branch for Roozylabs development and deployment.
   * Set as the Default Branch in GitHub repository settings.
3. **`roozy/<feature>` (Feature Branches):**
   * All new features, adapters, and UI updates branch off `roozy-main` and are merged back into `roozy-main` via Pull Requests.

### Upstream Synchronization Procedure
Whenever upstream updates need to be pulled:
```bash
# 1. Update master mirror
git checkout master
git fetch upstream
git merge upstream/master --ff-only
git push origin master

# 2. Integrate into Roozylabs production branch
git checkout roozy-main
git merge master
# Resolve any minor touchpoint conflicts (e.g., registry imports)
git push origin roozy-main
```

---

## 3. Code Isolation & Monorepo Structure

Paperclip is a pnpm monorepo governed by Turborepo. All Roozylabs additions will live in newly created directories untracked by upstream, guaranteeing zero conflict on those files:

```
paperclip/
├── packages/
│   ├── adapters/
│   │   ├── ... (upstream built-in adapters)
│   │   └── antigravity-local/        # [NEW] Roozylabs Antigravity CLI adapter
│   └── ...
├── skills/
│   ├── ... (upstream skills)
│   └── roozy-<skill-name>/            # [NEW] Roozylabs custom skills
├── ui/
│   └── src/
│       ├── roozy/                    # [NEW] Isolated Roozylabs branding & tokens
│       │   ├── brand.ts
│       │   └── theme.css
│       ├── App.tsx                   # [TOUCHPOINT] Injects brand wrapper
│       └── index.css                 # [TOUCHPOINT] Imports theme.css
├── scripts/
│   └── sync-upstream.mjs             # [NEW] Automated sync script
├── .env.roozy.example                # [NEW] Environment variable reference for Roozylabs
└── package.json                      # [TOUCHPOINT] Adds sync:upstream npm script
```

### The "Minimal Touchpoint" Principle
* Only touch upstream files when strictly necessary for module registration (e.g., 1 line in adapter registry, 1 line in root layout).
* If an upstream file must be edited, keep changes grouped and cleanly commented:
  ```ts
  // --- Roozylabs Customization Start ---
  import { registerAntigravityAdapter } from "@paperclipai/adapter-antigravity-local";
  registerAntigravityAdapter();
  // --- Roozylabs Customization End ---
  ```

---

## 4. Antigravity CLI Adapter Specification

Paperclip standardizes agent execution across different backends using the `@paperclipai/adapter-utils` contract. The Antigravity adapter will be created at:
`packages/adapters/antigravity-local/`

### Metadata (`src/index.ts`)
* **`type`**: `"antigravity_local"`
* **`label`**: `"Google Antigravity CLI"`
* **`models`**:
  * `gemini-2.5-pro` (Gemini 2.5 Pro)
  * `gemini-2.5-flash` (Gemini 2.5 Flash)
  * `gemini-3.8-flash` (Gemini 3.8 Flash)
* **Configuration Doc**: Documents required CLI path, workspace runtime configuration, and permissions.

### Server Execution (`src/server/execute.ts`)
* Uses `runChildProcess()` from `@paperclipai/adapter-utils/server-utils`.
* Executes `agy` with arguments generated from the run context (working directory, prompt template, model flags).
* Implements output streaming and parse logic (`src/server/parse.ts`) to capture execution state and token usage.

### Diagnostics (`src/server/test.ts`)
* Verifies `agy` executable availability in system `$PATH`.
* Checks authentication state and reports clear setup instructions if unauthenticated.

### UI Form & Transcript Parser (`src/ui/`)
* Provides agent configuration fields in the Paperclip web dashboard.
* Parses stdout/stderr logs into structured chat/activity transcripts.

---

## 5. UI & Branding Customization Specification

### Centralized Brand Module (`ui/src/roozy/brand.ts`)
```ts
export const ROOZY_BRAND = {
  appName: "Paperclip (Roozylabs Edition)",
  shortName: "Roozylabs Paperclip",
  companyName: "Roozylabs",
  websiteUrl: "https://roozylabs.com",
  docsUrl: "https://docs.roozylabs.com",
  themeColor: "#4f46e5", // Roozylabs signature color
};
```

### Theme Tokens (`ui/src/roozy/theme.css`)
Overrides Tailwind/CSS custom properties (colors, radius, font families) without altering base components.

---

## 6. Sync Automation Script (`scripts/sync-upstream.mjs`)

A cross-platform Node.js script executed via `pnpm run sync:upstream` that performs:
1. **Dirty Tree Check:** Verifies no uncommitted changes exist in working tree.
2. **Fetch:** Executes `git fetch upstream`.
3. **Master Fast-Forward:** Switches to `master`, merges `upstream/master --ff-only`, and pushes to `origin/master`.
4. **Roozy Merge:** Switches to `roozy-main` and merges `master`.
5. **Build Check:** Runs `pnpm turbo run build --filter=@paperclipai/adapter-antigravity-local...` to confirm integrity.
6. **Notification:** Reports clean sync or flags any merge conflict files needing human resolution.

---

## 7. Next Steps & Implementation Plan

Following the Superpowers workflow, once this spec is reviewed and committed:
1. Setup git remote `upstream` and create `roozy-main`.
2. Implement the sync automation script `scripts/sync-upstream.mjs`.
3. Scaffold `ui/src/roozy/` branding infrastructure.
4. Scaffold `packages/adapters/antigravity-local/` adapter package and register with server & UI.
5. End-to-end verification.
