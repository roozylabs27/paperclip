# Roozylabs Paperclip Fork Customization & Upstream Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement upstream synchronization automation, Roozylabs UI/branding layer, and the Google Antigravity CLI adapter while preserving clean boundaries to eliminate upstream merge conflicts.

**Architecture:** Monorepo isolation strategy. All Roozylabs specific additions live in untracked isolated folders (`packages/adapters/antigravity-local/`, `ui/src/roozy/`, `scripts/sync-upstream.mjs`), with minimal entrypoint registrations into upstream. Git workflow enforces `master` as clean mirror and `roozy-main` as Roozylabs production branch.

**Tech Stack:** TypeScript, Node.js, pnpm workspaces, Turborepo, React 19, Tailwind CSS, Vitest.

## Global Constraints

- Never commit custom code directly to `master`. Custom commits belong exclusively to `roozy-main` or `roozy/<feature>` branches.
- Local git author must remain `roozylabs <roozylabs@gmail.com>`.
- SSH remote for origin must use `git@github-roozylabs:roozylabs27/paperclip.git`.
- Keep modifications to upstream files minimal (isolated imports only).

---

### Task 1: Upstream Sync Automation Script & Package Shortcut

**Files:**
- Create: `scripts/sync-upstream.mjs`
- Create: `scripts/sync-upstream.test.mjs`
- Modify: `package.json:20-30`

**Interfaces:**
- Consumes: Node child_process (`execSync`), git CLI.
- Produces: CLI script `pnpm run sync:upstream` that handles dirty check, upstream fetch, master fast-forward, and roozy-main merge.

- [ ] **Step 1: Write the failing test for the sync script runner logic**

Create `scripts/sync-upstream.test.mjs`:
```javascript
import { describe, it, expect } from "vitest";
import { parseSyncArgs } from "./sync-upstream.mjs";

describe("sync-upstream argument parsing", () => {
  it("defaults to dryRun: false and verifyBuild: true", () => {
    const opts = parseSyncArgs([]);
    expect(opts.dryRun).toBe(false);
    expect(opts.verifyBuild).toBe(true);
  });

  it("handles --dry-run flag", () => {
    const opts = parseSyncArgs(["--dry-run"]);
    expect(opts.dryRun).toBe(true);
  });

  it("handles --skip-build flag", () => {
    const opts = parseSyncArgs(["--skip-build"]);
    expect(opts.verifyBuild).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run scripts/sync-upstream.test.mjs`
Expected: FAIL with "Cannot find module './sync-upstream.mjs'"

- [ ] **Step 3: Implement `scripts/sync-upstream.mjs`**

Create `scripts/sync-upstream.mjs`:
```javascript
#!/usr/bin/env node
import { execSync } from "node:child_process";

export function parseSyncArgs(argv = process.argv.slice(2)) {
  return {
    dryRun: argv.includes("--dry-run"),
    verifyBuild: !argv.includes("--skip-build"),
  };
}

function run(cmd, dryRun = false) {
  console.log(`\n> ${cmd}`);
  if (dryRun) return "";
  return execSync(cmd, { stdio: "inherit", encoding: "utf-8" });
}

export function syncUpstream(options = {}) {
  const { dryRun = false, verifyBuild = true } = options;

  console.log("=== Roozylabs Upstream Sync ===");

  // 1. Check working directory status
  const status = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
  if (status) {
    throw new Error(
      "Working directory contains uncommitted changes. Please stash or commit before syncing."
    );
  }

  // 2. Fetch upstream
  run("git fetch upstream", dryRun);

  // 3. Fast-forward master mirror
  run("git checkout master", dryRun);
  run("git merge upstream/master --ff-only", dryRun);
  run("git push origin master", dryRun);

  // 4. Merge into roozy-main
  run("git checkout roozy-main", dryRun);
  run("git merge master", dryRun);

  // 5. Verification build (optional)
  if (verifyBuild && !dryRun) {
    console.log("\nVerifying build integrity...");
    run("pnpm turbo run build --filter=@paperclipai/shared...");
  }

  console.log("\n✅ Sync complete. You can now run `git push origin roozy-main`.\n");
}

if (process.argv[1] && process.argv[1].endsWith("sync-upstream.mjs")) {
  try {
    const opts = parseSyncArgs();
    syncUpstream(opts);
  } catch (err) {
    console.error(`\n❌ Sync failed: ${err.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Register `sync:upstream` in `package.json`**

Add script in root `package.json`:
```json
"sync:upstream": "node scripts/sync-upstream.mjs"
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `pnpm exec vitest run scripts/sync-upstream.test.mjs`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/sync-upstream.mjs scripts/sync-upstream.test.mjs package.json
git commit -m "feat(sync): add automated upstream synchronization script"
```

---

### Task 2: Roozylabs UI & Branding Module

**Files:**
- Create: `ui/src/roozy/brand.ts`
- Create: `ui/src/roozy/brand.test.ts`
- Create: `ui/src/roozy/theme.css`
- Modify: `ui/src/index.css:1-10`

**Interfaces:**
- Produces: `ROOZY_BRAND` constant containing application name, company info, links, and themes.
- Produces: `ui/src/roozy/theme.css` overriding CSS variables for primary Roozylabs aesthetic.

- [ ] **Step 1: Write the failing unit test for brand metadata**

Create `ui/src/roozy/brand.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { ROOZY_BRAND, getFormattedTitle } from "./brand";

describe("ROOZY_BRAND", () => {
  it("provides company and app names", () => {
    expect(ROOZY_BRAND.companyName).toBe("Roozylabs");
    expect(ROOZY_BRAND.appName).toContain("Roozylabs");
  });

  it("formats page title correctly", () => {
    expect(getFormattedTitle("Agents")).toBe("Agents | Roozylabs Paperclip");
    expect(getFormattedTitle()).toBe("Roozylabs Paperclip");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run ui/src/roozy/brand.test.ts`
Expected: FAIL with "Cannot find module './brand'"

- [ ] **Step 3: Implement `ui/src/roozy/brand.ts` and `ui/src/roozy/theme.css`**

Create `ui/src/roozy/brand.ts`:
```typescript
export const ROOZY_BRAND = {
  appName: "Paperclip (Roozylabs Edition)",
  shortName: "Roozylabs Paperclip",
  companyName: "Roozylabs",
  websiteUrl: "https://roozylabs.com",
  docsUrl: "https://docs.roozylabs.com",
  themeColor: "#4f46e5",
  tagline: "Autonomous Agent Orchestration for Roozylabs",
} as const;

export function getFormattedTitle(pageTitle?: string): string {
  if (!pageTitle) return ROOZY_BRAND.shortName;
  return `${pageTitle} | ${ROOZY_BRAND.shortName}`;
}
```

Create `ui/src/roozy/theme.css`:
```css
/* Roozylabs Theme Overrides */
:root {
  --roozy-brand-primary: #4f46e5;
  --roozy-brand-accent: #6366f1;
}

[data-theme="dark"] {
  --roozy-brand-primary: #6366f1;
  --roozy-brand-accent: #818cf8;
}
```

- [ ] **Step 4: Import `theme.css` in `ui/src/index.css`**

Add at the top of `ui/src/index.css`:
```css
@import "./roozy/theme.css";
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `pnpm exec vitest run ui/src/roozy/brand.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add ui/src/roozy/ ui/src/index.css
git commit -m "feat(ui): add roozylabs branding config and theme tokens"
```

---

### Task 3: Antigravity CLI Adapter Package Scaffolding

**Files:**
- Create: `packages/adapters/antigravity-local/package.json`
- Create: `packages/adapters/antigravity-local/tsconfig.json`
- Create: `packages/adapters/antigravity-local/src/index.ts`
- Create: `packages/adapters/antigravity-local/src/index.test.ts`
- Create: `packages/adapters/antigravity-local/src/server/index.ts`
- Create: `packages/adapters/antigravity-local/src/server/test.ts`
- Create: `packages/adapters/antigravity-local/src/server/execute.ts`
- Create: `packages/adapters/antigravity-local/src/server/parse.ts`
- Create: `packages/adapters/antigravity-local/src/ui/index.ts`
- Create: `packages/adapters/antigravity-local/src/cli/index.ts`

**Interfaces:**
- Produces: `@paperclipai/adapter-antigravity-local` package.
- Exports:
  - `type = "antigravity_local"`
  - `label = "Google Antigravity CLI"`
  - `models`: list of supported Gemini models (`gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-3.8-flash`)
  - Server handlers: `execute`, `testEnvironment`

- [ ] **Step 1: Write the failing unit test for adapter metadata**

Create `packages/adapters/antigravity-local/src/index.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { type, label, models, resolveAntigravityModel } from "./index";

describe("antigravity-local adapter", () => {
  it("exports correct metadata", () => {
    expect(type).toBe("antigravity_local");
    expect(label).toBe("Google Antigravity CLI");
    expect(models.length).toBeGreaterThan(0);
    expect(models.map((m) => m.id)).toContain("gemini-2.5-pro");
  });

  it("resolves default model when unspecified", () => {
    expect(resolveAntigravityModel("")).toBe("gemini-2.5-pro");
    expect(resolveAntigravityModel(undefined)).toBe("gemini-2.5-pro");
    expect(resolveAntigravityModel("gemini-2.5-flash")).toBe("gemini-2.5-flash");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/adapters/antigravity-local/src/index.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement package configuration files**

Create `packages/adapters/antigravity-local/package.json`:
```json
{
  "name": "@paperclipai/adapter-antigravity-local",
  "version": "0.1.0",
  "description": "Google Antigravity CLI agent adapter for Paperclip",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./server": "./src/server/index.ts",
    "./ui": "./src/ui/index.ts",
    "./cli": "./src/cli/index.ts"
  },
  "dependencies": {
    "@paperclipai/adapter-utils": "workspace:*",
    "@paperclipai/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^3.2.4"
  }
}
```

Create `packages/adapters/antigravity-local/tsconfig.json`:
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Implement adapter source files**

Create `packages/adapters/antigravity-local/src/index.ts`:
```typescript
export const type = "antigravity_local";
export const label = "Google Antigravity CLI";
export const DEFAULT_ANTIGRAVITY_MODEL = "gemini-2.5-pro";

export const models = [
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
];

export function resolveAntigravityModel(model?: unknown): string {
  if (typeof model === "string" && model.trim()) {
    return model.trim();
  }
  return DEFAULT_ANTIGRAVITY_MODEL;
}

export const agentConfigurationDoc = `# antigravity_local configuration

Adapter: antigravity_local

Core fields:
- command (string, optional): defaults to "agy"
- model (string, optional): model identifier (defaults to ${DEFAULT_ANTIGRAVITY_MODEL})
- cwd (string, optional): working directory fallback
- promptTemplate (string, optional): prompt template for runs
`;
```

Create `packages/adapters/antigravity-local/src/server/test.ts`:
```typescript
import { execSync } from "node:child_process";
import type { AdapterEnvironmentTestResult } from "@paperclipai/shared";

export async function testEnvironment(): Promise<AdapterEnvironmentTestResult> {
  try {
    const version = execSync("agy --version", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return {
      status: "pass",
      summary: `Antigravity CLI detected (${version})`,
      checks: [
        {
          name: "executable",
          level: "info",
          status: "pass",
          message: `Found agy executable (${version})`,
        },
      ],
    };
  } catch {
    return {
      status: "fail",
      summary: "Antigravity CLI (agy) not found in system PATH",
      checks: [
        {
          name: "executable",
          level: "error",
          status: "fail",
          message: "Please install the Antigravity CLI and ensure 'agy' is accessible in PATH.",
        },
      ],
    };
  }
}
```

Create `packages/adapters/antigravity-local/src/server/parse.ts`:
```typescript
export interface AntigravityRunParseResult {
  output: string;
  inputTokens: number;
  outputTokens: number;
}

export function parseAntigravityOutput(stdout: string): AntigravityRunParseResult {
  return {
    output: stdout,
    inputTokens: 0,
    outputTokens: 0,
  };
}
```

Create `packages/adapters/antigravity-local/src/server/execute.ts`:
```typescript
import { runChildProcess, buildPaperclipEnv, asString } from "@paperclipai/adapter-utils/server-utils";
import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import { resolveAntigravityModel } from "../index.js";
import { parseAntigravityOutput } from "./parse.js";

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const config = (ctx.agent.adapterConfig || {}) as Record<string, unknown>;
  const command = asString(config.command) || "agy";
  const model = resolveAntigravityModel(config.model);
  const prompt = asString(config.promptTemplate) || "Execute current tasks.";

  const env = buildPaperclipEnv(ctx.agent);
  const args = ["run", "--model", model, prompt];

  const result = await runChildProcess(command, {
    args,
    env,
    cwd: ctx.workspaceDir,
  });

  const parsed = parseAntigravityOutput(result.stdout);

  return {
    exitCode: result.exitCode ?? 0,
    output: parsed.output,
    usage: {
      inputTokens: parsed.inputTokens,
      outputTokens: parsed.outputTokens,
    },
  };
}
```

Create `packages/adapters/antigravity-local/src/server/index.ts`:
```typescript
export { execute } from "./execute.js";
export { testEnvironment } from "./test.js";
export { parseAntigravityOutput } from "./parse.js";
```

Create `packages/adapters/antigravity-local/src/ui/index.ts`:
```typescript
import { type, label, models } from "../index.js";

export const uiAdapter = {
  type,
  label,
  models,
};

export default uiAdapter;
```

Create `packages/adapters/antigravity-local/src/cli/index.ts`:
```typescript
export function formatEvent(event: unknown): string {
  return JSON.stringify(event);
}
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `pnpm exec vitest run packages/adapters/antigravity-local/src/index.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/adapters/antigravity-local/
git commit -m "feat(adapters): scaffold antigravity-local adapter package"
```

---

### Task 4: Adapter Registration in Server & UI Registries

**Files:**
- Modify: `server/src/adapters/registry.ts`
- Modify: `ui/src/adapters/registry.ts` (or `ui/src/adapters/index.ts`)

**Interfaces:**
- Consumes: `@paperclipai/adapter-antigravity-local` exports.
- Produces: Available `antigravity_local` agent type selectable in UI and executed by server.

- [ ] **Step 1: Write test verifying adapter is registered in server adapter list**

Run: `pnpm exec vitest run server/src/adapters/registry.test.ts` (if exists) or check registration list.

- [ ] **Step 2: Register in `server/src/adapters/registry.ts`**

Add import and registration block:
```typescript
import {
  execute as antigravityExecute,
  testEnvironment as antigravityTestEnvironment,
} from "@paperclipai/adapter-antigravity-local/server";
import {
  type as antigravityType,
  models as antigravityModels,
  agentConfigurationDoc as antigravityDoc,
} from "@paperclipai/adapter-antigravity-local";
```

Register in builtin adapter map:
```typescript
[antigravityType]: {
  type: antigravityType,
  models: antigravityModels,
  execute: antigravityExecute,
  testEnvironment: antigravityTestEnvironment,
  agentConfigurationDoc: antigravityDoc,
},
```

- [ ] **Step 3: Register in `ui/src/adapters/index.ts`**

Register `antigravity_local` so it appears in agent creation dropdown:
```typescript
import antigravityUI from "@paperclipai/adapter-antigravity-local/ui";
registerUIAdapter(antigravityUI);
```

- [ ] **Step 4: Run typecheck to verify registration**

Run: `pnpm turbo run check`
Expected: Success with no type errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/adapters/ ui/src/adapters/
git commit -m "feat(adapters): register antigravity_local in server and ui registries"
```

---

### Task 5: End-to-End Build & Upstream Sync Verification

- [ ] **Step 1: Test full workspace build**

Run: `pnpm turbo run build --filter=@paperclipai/adapter-antigravity-local...`
Expected: Build succeeds.

- [ ] **Step 2: Test upstream sync script dry-run**

Run: `pnpm run sync:upstream --dry-run`
Expected: Successfully displays git fetch upstream, checkout master, ff merge, push origin master, checkout roozy-main, and merge master without error.

- [ ] **Step 3: Push `roozy-main` to origin fork**

Run: `git push -u origin roozy-main`
Expected: Pushed cleanly to `git@github-roozylabs:roozylabs27/paperclip.git`.
