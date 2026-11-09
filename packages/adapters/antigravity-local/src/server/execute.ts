import { runChildProcess, buildPaperclipEnv, asString } from "@paperclipai/adapter-utils/server-utils";
import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import { resolveAntigravityModel } from "../index.js";
import { parseAntigravityOutput } from "./parse.js";

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const config = (ctx.agent.adapterConfig || {}) as Record<string, unknown>;
  const command = asString(config.command, "agy");
  const model = resolveAntigravityModel(config.model);
  const prompt = asString(config.promptTemplate, "Execute current tasks.");

  const env = buildPaperclipEnv(ctx.agent);
  const args = ["run", "--model", model, prompt];

  const cwd = (ctx as { workspaceDir?: string }).workspaceDir || asString(config.cwd, "") || process.cwd();

  const result = await runChildProcess(ctx.runId ?? `agy-${Date.now()}`, command, args, {
    cwd,
    env,
    timeoutSec: 3600,
    graceSec: 10,
    onLog: ctx.onLog ?? (async () => {}),
  });

  const parsed = parseAntigravityOutput(result.stdout);

  return {
    exitCode: result.exitCode ?? 0,
    signal: result.signal ?? null,
    timedOut: result.timedOut ?? false,
    summary: parsed.output,
    resultJson: {
      output: parsed.output,
    },
    usage: {
      inputTokens: parsed.inputTokens,
      outputTokens: parsed.outputTokens,
    },
  };
}
