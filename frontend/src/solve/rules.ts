import type { Difficulty } from "../game/types";

export const MAX_LENGTH = 2000;

/** The game rules in force (D-047); the server decides, the pages explain. */
export interface GameRules {
  baseXp: number;
  mediumBonus: number;
  hardBonus: number;
  timeBonus: number;
  easyMinutes: number;
  mediumMinutes: number;
  hardMinutes: number;
  hintPenaltyPercent: number;
  hintsPerWindow: number;
  hintWindowHours: number;
  passScore: number;
  practiceOpenPercent: number;
  practiceDoneXp: number;
  quickCheckXp: number;
  levelTarget: number;
}

/** The defaults of D-040, used until the server's rules arrive. */
export const DEFAULT_RULES: GameRules = {
  baseXp: 15,
  mediumBonus: 9,
  hardBonus: 20,
  timeBonus: 5,
  easyMinutes: 15,
  mediumMinutes: 25,
  hardMinutes: 40,
  hintPenaltyPercent: 20,
  hintsPerWindow: 3,
  hintWindowHours: 5,
  passScore: 70,
  practiceOpenPercent: 70,
  practiceDoneXp: 10,
  quickCheckXp: 5,
  levelTarget: 150,
};

export function difficultyBonus(difficulty: Difficulty, rules = DEFAULT_RULES) {
  if (difficulty === "Medium") return rules.mediumBonus;
  if (difficulty === "Hard") return rules.hardBonus;
  return 0;
}

export function timeLimitMinutes(
  difficulty: Difficulty,
  rules = DEFAULT_RULES,
) {
  if (difficulty === "Medium") return rules.mediumMinutes;
  if (difficulty === "Hard") return rules.hardMinutes;
  return rules.easyMinutes;
}

export const timeLimitSeconds = (
  difficulty: Difficulty,
  rules = DEFAULT_RULES,
) => timeLimitMinutes(difficulty, rules) * 60;

/** XP of a first solve right now: full XP for the difficulty, time bonus, hints. */
export function maxXp(
  difficulty: Difficulty,
  seconds: number,
  hintsUsed = 0,
  rules = DEFAULT_RULES,
): number {
  const inTime = seconds <= timeLimitSeconds(difficulty, rules);
  const raw =
    rules.baseXp +
    difficultyBonus(difficulty, rules) +
    (inTime ? rules.timeBonus : 0);
  const percent = Math.max(0, 100 - rules.hintPenaltyPercent * hintsUsed);
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
