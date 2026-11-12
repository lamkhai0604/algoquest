export type CodeLanguage = "javascript" | "java";

/** What the code panel needs (FR-07). Expected outputs never reach the browser (D-035). */
export interface CodeSetup {
  functionName: string | null;
  inputs: unknown[][];
  javaRunsLeft: number;
  javaDailyLimit: number;
  solved: boolean;
  codeBonusAwarded: boolean;
}

export interface CodeResult {
  language: CodeLanguage;
  passed: number;
  total: number;
  failedInput: unknown[] | null;
  /** What the code returned for the first failing test, as JSON text. */
  failedOutput: string | null;
  failedError: string | null;
  compileError: string | null;
  xpGained: number;
  codeBonusAwarded: boolean;
  levelXp: number;
  levelTarget: number;
  javaRunsLeft: number;
}

/** The browser's run of JavaScript code: one output or error per test. */
export interface BrowserRun {
  outputs: unknown[];
  errors: (string | null)[];
}
