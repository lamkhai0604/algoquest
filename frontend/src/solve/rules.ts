import type { Difficulty } from "../game/types";

/** Display values that mirror the XP rules (FR-08, D-040); the server decides. */
export const MAX_LENGTH = 2000;
export const PASS_TOTAL = 70;

export const BASE_XP = 15;
export const TIME_BONUS = 5;
export const HINT_PENALTY_PERCENT = 20;
export const QUICK_CHECK_XP = 5;
export const DIFFICULTY_BONUS: Record<Difficulty, number> = {
  Easy: 0,
  Medium: 9,
  Hard: 20,
};
export const TIME_LIMIT_MINUTES: Record<Difficulty, number> = {
  Easy: 15,
  Medium: 25,
  Hard: 40,
};

export const timeLimitSeconds = (difficulty: Difficulty) =>
  TIME_LIMIT_MINUTES[difficulty] * 60;

export function maxXp(
  difficulty: Difficulty,
  seconds: number,
  hintsUsed = 0,
): number {
  const inTime = seconds <= timeLimitSeconds(difficulty);
  const bonus = DIFFICULTY_BONUS[difficulty] + (inTime ? TIME_BONUS : 0);
  const raw = BASE_XP + bonus;
  const percent = Math.max(0, 100 - HINT_PENALTY_PERCENT * hintsUsed);
  return Math.floor((raw * percent) / 100);
}

/** "in 3h 12m" until an ISO time; "soon" when it has passed. */
export function refillIn(iso: string, now = Date.now()): string {
  const minutes = Math.ceil((new Date(iso).getTime() - now) / 60000);
  if (minutes <= 0) return "soon";
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `in ${hours}h ${minutes % 60}m` : `in ${minutes}m`;
}

export function clock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export const CRITERIA = [
  { key: "pattern", label: "Pattern and why", max: 40 },
  { key: "steps", label: "Steps", max: 30 },
  { key: "complexity", label: "Time and space", max: 20 },
  { key: "edgeCases", label: "Edge cases", max: 10 },
] as const;
