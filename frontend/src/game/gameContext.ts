import { createContext, useContext } from "react";
import type { Loadable } from "../api/useApiGet";
import type { HintQuota, Level } from "./types";

export interface GameContextValue {
  levels: Loadable<Level[]>;
  /** Fetches the levels again, for example after XP was earned. */
  reloadLevels: () => void;
  hintQuota: Loadable<HintQuota>;
  reloadHintQuota: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used inside GameProvider");
  return value;
}

export function hintsLeft(quota: Loadable<HintQuota>): number {
  return quota.status === "ready" ? quota.data.remaining : 0;
}

export function totalXp(levels: Loadable<Level[]>): number {
  if (levels.status !== "ready") return 0;
  return levels.data.reduce((sum, level) => sum + level.xp, 0);
}
