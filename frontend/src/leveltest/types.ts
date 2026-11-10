import type { LevelState } from "../game/types";
import type { ProblemDetail } from "../solve/types";

export interface CriterionScores {
  pattern: number;
  steps: number;
  complexity: number;
  edgeCases: number;
  feedback: string;
}

export interface TestProblem {
  problem: Omit<ProblemDetail, "openedAt">;
  answer: string;
  result: CriterionScores | null;
}

export interface LevelTest {
  id: string;
  level: number;
  status: "running" | "timeUp" | "submitted";
  startedAt: string;
  endsAt: string;
  serverTime: string;
  problems: TestProblem[];
  score: number | null;
  nextLevelState: LevelState | null;
}

export const totalOf = (scores: CriterionScores) =>
  scores.pattern + scores.steps + scores.complexity + scores.edgeCases;
