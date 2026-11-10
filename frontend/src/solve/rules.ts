import type { Difficulty } from "../game/types";

/** Display values that mirror the XP rules (FR-08); the server decides. */
export const MAX_LENGTH = 2000;
export const PASS_TOTAL = 70;

const BASE_XP = 20;
const TIME_BONUS = 5;
const DIFFICULTY_BONUS: Record<Difficulty, number> = {
  Easy: 0,
  Medium: 10,
  Hard: 25,
};
const TIME_LIMIT_MINUTES: Record<Difficulty, number> = {
  Easy: 15,
  Medium: 25,
  Hard: 40,
};

export const timeLimitSeconds = (difficulty: Difficulty) =>
  TIME_LIMIT_MINUTES[difficulty] * 60;

export function maxXp(difficulty: Difficulty, seconds: number): number {
  const inTime = seconds <= timeLimitSeconds(difficulty);
  return BASE_XP + DIFFICULTY_BONUS[difficulty] + (inTime ? TIME_BONUS : 0);
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
