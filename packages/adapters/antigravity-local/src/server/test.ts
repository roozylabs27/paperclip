import { execSync } from "node:child_process";
import type { AdapterEnvironmentTestResult } from "@paperclipai/shared";
import type { AdapterEnvironmentTestContext } from "@paperclipai/adapter-utils";

export async function testEnvironment(
  ctx?: Partial<AdapterEnvironmentTestContext>,
): Promise<AdapterEnvironmentTestResult> {
  const adapterType = ctx?.adapterType ?? "antigravity_local";
  const testedAt = new Date().toISOString();
  try {
    const version = execSync("agy --version", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return {
      adapterType,
      status: "pass",
      checks: [
        {
          code: "executable",
          level: "info",
          message: `Found agy executable (${version})`,
        },
      ],
      testedAt,
    };
  } catch {
    return {
      adapterType,
      status: "fail",
      checks: [
        {
          code: "executable",
          level: "error",
          message: "Please install the Antigravity CLI and ensure 'agy' is accessible in PATH.",
        },
      ],
      testedAt,
    };
  }
}
