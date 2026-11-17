/** Pattern Recognition (D-057). Labels arrive only with an answer's result. */
export type ApproachLabel = "best" | "valid" | "unsuitable";

export interface ChallengeSummary {
  id: string;
  title: string;
  /** The best label this player has reached on the challenge, or null if not tried. */
  bestLabel: ApproachLabel | null;
}

export interface Choice {
  id: string;
  name: string;
  hint: string;
}

export interface ChallengeView {
  id: string;
  level: number;
  levelTitle: string;
  title: string;
  statement: string;
  examples: string[];
  constraints: string[];
  approaches: Choice[];
  answersLeftToday: number;
}

export interface Approach extends Choice {
  label: ApproachLabel;
  time: string;
  space: string;
  why: string;
}

export interface AnswerResult {
  approach: string;
  label: ApproachLabel;
  correct: boolean;
  bestApproach: string;
  reasonScore: number;
  reason: number;
  complexity: number;
  feedback: string;
  comparison: Approach[];
  answersLeftToday: number;
}

export const LABEL_TEXT: Record<ApproachLabel, string> = {
  best: "Best fit",
  valid: "Valid, not the best",
  unsuitable: "Does not fit this problem",
};
