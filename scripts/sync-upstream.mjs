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
    run("pnpm --filter @paperclipai/adapter-antigravity-local build");
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
