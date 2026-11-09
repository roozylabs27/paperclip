export interface AntigravityRunParseResult {
  output: string;
  inputTokens: number;
  outputTokens: number;
}

export function parseAntigravityOutput(stdout: string): AntigravityRunParseResult {
  return {
    output: stdout,
    inputTokens: 0,
    outputTokens: 0,
  };
}
