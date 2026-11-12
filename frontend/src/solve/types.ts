import type { Difficulty } from "../game/types";

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string | null;
}

export interface ProblemDetail {
  id: string;
  level: number;
  title: string;
  difficulty: Difficulty;
  statement: string;
  examples: ProblemExample[];
  constraints: string[];
  hintCount: number;
  /** Active working time so far: the clock of the time bonus (D-043). */
  activeSeconds: number;
  /** The latest graded explanation, or null before the first one (D-042). */
  lastResult: AttemptResult | null;
  /** The next problem in the level's order, or null after the last one. */
  nextProblemId: string | null;
}

export type AttemptMode = "explain" | "practice";

export interface AttemptResult {
  attemptId: string;
  mode: AttemptMode;
  /** The explanation that was graded. */
  explanation: string;
  pattern: number;
  steps: number;
  complexity: number;
  edgeCases: number;
  total: number;
  solved: boolean;
  feedback: string;
  xpGained: number;
  levelXp: number;
  levelTarget: number;
}
