export const type = "antigravity_local";
export const label = "Google Antigravity CLI";
export const DEFAULT_ANTIGRAVITY_MODEL = "gemini-2.5-pro";

export interface AntigravityModel {
  id: string;
  label: string;
}

export const models: AntigravityModel[] = [
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
