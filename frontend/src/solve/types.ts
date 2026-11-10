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
}

export interface AttemptResult {
  attemptId: string;
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
