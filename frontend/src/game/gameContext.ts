import { createContext, useContext } from "react";
import type { Loadable } from "../api/useApiGet";
import type { Level } from "./types";

export interface GameContextValue {
  levels: Loadable<Level[]>;
  /** Fetches the levels again, for example after XP was earned. */
  reloadLevels: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used inside GameProvider");
  return value;
}

export function totalXp(levels: Loadable<Level[]>): number {
  if (levels.status !== "ready") return 0;
  return levels.data.reduce((sum, level) => sum + level.xp, 0);
}
