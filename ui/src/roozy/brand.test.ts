import { describe, it, expect } from "vitest";
import { ROOZY_BRAND, getFormattedTitle } from "./brand";

describe("ROOZY_BRAND", () => {
  it("provides company and app names", () => {
    expect(ROOZY_BRAND.companyName).toBe("Roozylabs");
    expect(ROOZY_BRAND.appName).toContain("Roozylabs");
  });

  it("formats page title correctly", () => {
    expect(getFormattedTitle("Agents")).toBe("Agents | Roozylabs Paperclip");
    expect(getFormattedTitle()).toBe("Roozylabs Paperclip");
  });
});
