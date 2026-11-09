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
