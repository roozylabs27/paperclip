import { describe, it, expect } from "vitest";
import { type, label, models, resolveAntigravityModel } from "./index.js";

describe("antigravity-local adapter", () => {
  it("exports correct metadata", () => {
    expect(type).toBe("antigravity_local");
    expect(label).toBe("Google Antigravity CLI");
    expect(models.length).toBeGreaterThan(0);
    expect(models.map((m) => m.id)).toContain("gemini-3.8-flash-medium");
  });

  it("resolves default model when unspecified", () => {
    expect(resolveAntigravityModel("")).toBe("gemini-3.8-flash-medium");
    expect(resolveAntigravityModel(undefined)).toBe("gemini-3.8-flash-medium");
    expect(resolveAntigravityModel("gemini-3.8-flash-high")).toBe("gemini-3.8-flash-high");
    expect(resolveAntigravityModel("gemini-2.5-pro")).toBe("gemini-3.8-flash-medium");
    expect(resolveAntigravityModel("gemini-3.8-flash")).toBe("gemini-3.8-flash-medium");
  });
});
