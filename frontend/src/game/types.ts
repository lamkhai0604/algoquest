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
  bestTestScore: number | null;
}

export interface Profile {
  displayName: string;
  totalXp: number;
  solvedProblems: number;
  currentStreak: number;
  bestStreak: number;
  levels: Level[];
}

export interface HintQuota {
  remaining: number;
  perWindow: number;
  /** When the next hint comes back (ISO time), or null when none is in use. */
  refillsAt: string | null;
}

export interface Hints {
  opened: string[];
  total: number;
  quota: HintQuota;
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
  practiceDone: boolean;
}
