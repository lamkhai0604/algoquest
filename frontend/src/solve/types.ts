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
  /** When the player first opened the problem; the time bonus runs from here. */
  openedAt: string;
}

export type AttemptMode = "explain" | "practice";

export interface AttemptResult {
  attemptId: string;
  mode: AttemptMode;
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
