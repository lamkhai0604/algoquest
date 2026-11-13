import { createContext, useContext } from "react";
import type { GameRules } from "../solve/rules";
import type { Loadable } from "../api/useApiGet";
import type { HintQuota, Level, Profile } from "./types";

export interface GameContextValue {
  levels: Loadable<Level[]>;
  profile: Loadable<Profile>;
  /** Fetches the levels and the profile again, for example after XP was earned. */
  reloadLevels: () => void;
  hintQuota: Loadable<HintQuota>;
  reloadHintQuota: () => void;
  /** The game rules in force (D-047); the defaults until loaded. */
  rules: GameRules;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used inside GameProvider");
  return value;
}

export function streakDays(profile: Loadable<Profile>): number {
  return profile.status === "ready" ? profile.data.currentStreak : 0;
}

export function hintsLeft(quota: Loadable<HintQuota>): number {
  return quota.status === "ready" ? quota.data.remaining : 0;
}

export function totalXp(levels: Loadable<Level[]>): number {
  if (levels.status !== "ready") return 0;
  return levels.data.reduce((sum, level) => sum + level.xp, 0);
}
