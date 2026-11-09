export const ROOZY_BRAND = {
  appName: "Paperclip (Roozylabs Edition)",
  shortName: "Roozylabs Paperclip",
  companyName: "Roozylabs",
  websiteUrl: "https://roozylabs.com",
  docsUrl: "https://docs.roozylabs.com",
  themeColor: "#4f46e5",
  tagline: "Autonomous Agent Orchestration for Roozylabs",
} as const;

export function getFormattedTitle(pageTitle?: string): string {
  if (!pageTitle) return ROOZY_BRAND.shortName;
  return `${pageTitle} | ${ROOZY_BRAND.shortName}`;
}
