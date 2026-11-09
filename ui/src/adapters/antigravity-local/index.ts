import { type, label, models } from "@paperclipai/adapter-antigravity-local";
import type { UIAdapterModule } from "../types";
import { SchemaConfigFields, buildSchemaAdapterConfig } from "../schema-config-fields";

export const antigravityLocalUIAdapter: UIAdapterModule = {
  type,
  label,
  models,
  parseStdoutLine: (line: string, ts?: string) => {
    const timestamp = ts ?? new Date().toISOString();
    const entry = { text: line, timestamp, kind: "stdout" as const, ts: timestamp };
    const arr = [entry];
    return Object.assign(arr, entry);
  },
  ConfigFields: SchemaConfigFields,
  buildAdapterConfig: buildSchemaAdapterConfig,
} as unknown as UIAdapterModule;
