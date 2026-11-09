import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@paperclipai/adapter-utils/server-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@paperclipai/adapter-utils/server-utils")>();
  return {
    ...actual,
    runChildProcess: vi.fn(async () => ({
      exitCode: 0,
      signal: null,
      timedOut: false,
      stdout: "Antigravity task completed.",
      stderr: "",
    })),
  };
});

import { execute } from "./execute.js";
import * as serverUtils from "@paperclipai/adapter-utils/server-utils";

describe("antigravity-local execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards ctx.onSpawn to runChildProcess", async () => {
    const onSpawn = vi.fn(async () => undefined);
    const onLog = vi.fn(async () => undefined);

    const ctx = {
      runId: "agy-test-123",
      agent: {
        id: "agent-1",
        companyId: "company-1",
        name: "Antigravity Agent",
        adapterType: "antigravity_local",
        adapterConfig: {
          command: "agy",
          model: "gemini-2.5-pro",
          promptTemplate: "Do something",
        },
      },
      onSpawn,
      onLog,
    };

    const result = await execute(ctx as any);

    expect(result.exitCode).toBe(0);
    expect(result.summary).toBe("Antigravity task completed.");

    const mockedRun = vi.mocked(serverUtils.runChildProcess);
    expect(mockedRun).toHaveBeenCalledTimes(1);

    const callArgs = mockedRun.mock.calls[0];
    expect(callArgs[0]).toBe("agy-test-123");
    expect(callArgs[1]).toBe("agy");
    expect(callArgs[2]).toEqual(["run", "--model", "gemini-2.5-pro", "Do something"]);

    const opts = callArgs[3] as Record<string, unknown>;
    expect(opts.onSpawn).toBe(onSpawn);
  });
});
