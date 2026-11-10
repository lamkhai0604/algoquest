export type LevelState = "OPEN" | "EASY_ONLY" | "LOCKED";

export interface Level {
  number: number;
  slug: string;
  title: string;
  summary: string;
  available: boolean;
  state: LevelState;
  xp: number;
  target: number;
  practiceOpen: boolean;
  testOpen: boolean;
  problems: number;
  solved: number;
}

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface ProblemItem {
  id: string;
  title: string;
  difficulty: Difficulty;
  status: "ready" | "comingSoon";
  locked: boolean;
  solved: boolean;
  xp: number;
}
