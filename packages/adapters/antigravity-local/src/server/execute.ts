import {
  runChildProcess,
  buildPaperclipEnv,
  asString,
  asBoolean,
  asStringArray,
  renderTemplate,
  joinPromptSections,
  selectPaperclipPromptSections,
  DEFAULT_PAPERCLIP_AGENT_PROMPT_TEMPLATE,
  DEFAULT_PAPERCLIP_CONVERSATION_PROMPT_TEMPLATE,
} from "@paperclipai/adapter-utils/server-utils";
import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import { resolveAntigravityModel } from "../index.js";
import { parseAntigravityOutput } from "./parse.js";

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const agent = ctx.agent;
  const config = (agent?.adapterConfig || {}) as Record<string, unknown>;
  const command = asString(config.command, "agy");
  const model = resolveAntigravityModel(config.model);

  const context = (ctx.context || {}) as Record<string, unknown>;
  const templateData = {
    agentId: agent.id,
    companyId: agent.companyId,
    runId: ctx.runId,
    company: { id: agent.companyId },
    agent,
    run: { id: ctx.runId, source: "on_demand" },
    context,
  };

  const configuredPromptTemplate = asString(
    config.promptTemplate,
    context.conversationMode === true
      ? DEFAULT_PAPERCLIP_CONVERSATION_PROMPT_TEMPLATE
      : DEFAULT_PAPERCLIP_AGENT_PROMPT_TEMPLATE,
  );

  const { taskContextNote, wakePrompt } = selectPaperclipPromptSections(context, {
    resumedSession: false,
    includeCommunicationGuidance: false,
  });

  const renderedPrompt = renderTemplate(configuredPromptTemplate, templateData);
  const sessionHandoffNote = asString(context.paperclipSessionHandoffMarkdown, "").trim();

  const promptSections = [
    wakePrompt,
    taskContextNote,
    sessionHandoffNote,
    renderedPrompt,
  ].filter(Boolean);

  const prompt = promptSections.length > 0
    ? joinPromptSections(promptSections)
    : asString(config.promptTemplate, "Execute current tasks.");

  const env = buildPaperclipEnv(agent);
  if (ctx.runId) {
    env.PAPERCLIP_RUN_ID = ctx.runId;
  }

  const extraArgs = (() => {
    const fromExtraArgs = asStringArray(config.extraArgs);
    if (fromExtraArgs.length > 0) return fromExtraArgs;
    return asStringArray(config.args);
  })();

  const dangerouslySkipPermissions = asBoolean(config.dangerouslySkipPermissions, true);

  const args: string[] = ["-p", prompt, "--model", model];
  if (dangerouslySkipPermissions) {
    args.push("--dangerously-skip-permissions");
  }
  if (extraArgs.length > 0) {
    args.push(...extraArgs);
  }

  const cwd = (ctx as { workspaceDir?: string }).workspaceDir || asString(config.cwd, "") || process.cwd();

  const result = await runChildProcess(ctx.runId ?? `agy-${Date.now()}`, command, args, {
    cwd,
    env,
    timeoutSec: 3600,
    graceSec: 10,
    onLog: ctx.onLog ?? (async () => {}),
    onSpawn: ctx.onSpawn,
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
