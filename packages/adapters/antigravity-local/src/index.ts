export const type = "antigravity_local";
export const label = "Google Antigravity CLI";
export const DEFAULT_ANTIGRAVITY_MODEL = "gemini-3.8-flash-medium";

export interface AntigravityModel {
  id: string;
  label: string;
}

export const models: AntigravityModel[] = [
  { id: "gemini-3.8-flash-medium", label: "Gemini 3.8 Flash (Medium)" },
  { id: "gemini-3.8-flash-high", label: "Gemini 3.8 Flash (High)" },
  { id: "gemini-3.8-flash-low", label: "Gemini 3.8 Flash (Low)" },
  { id: "gemini-4-argon-medium", label: "Gemini 4 Argon (Medium)" },
  { id: "gemini-4-argon-high", label: "Gemini 4 Argon (High)" },
  { id: "gemini-4-argon-low", label: "Gemini 4 Argon (Low)" },
  { id: "claude-sonnet-5-5-medium", label: "Claude Sonnet 5.5 (Medium)" },
  { id: "claude-opus-5-5-medium", label: "Claude Opus 5.5 (Medium)" },
  { id: "gpt-oss-120b-medium", label: "GPT-OSS 120B (Medium)" },
];

const ANTIGRAVITY_MODEL_ALIASES: Record<string, string> = {
  "gemini-2.5-pro": "gemini-3.8-flash-medium",
  "gemini-2.5-flash": "gemini-3.8-flash-medium",
  "gemini-3.8-flash": "gemini-3.8-flash-medium",
  "gemini-3.8-flash-medium": "gemini-3.8-flash-medium",
  "gemini-4-argon": "gemini-4-argon-medium",
};

export function resolveAntigravityModel(model?: unknown): string {
  if (typeof model === "string" && model.trim()) {
    const trimmed = model.trim();
    return ANTIGRAVITY_MODEL_ALIASES[trimmed] ?? trimmed;
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
- dangerouslySkipPermissions (boolean, optional): defaults to true
`;
