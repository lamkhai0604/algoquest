import { useMemo } from "react";
import type { ReactNode } from "react";
import { useApiGet } from "../api/useApiGet";
import { useAuth } from "../auth";
import { GameContext } from "./gameContext";
import type { HintQuota, Level } from "./types";

/** Holds the signed-in player's levels, shared by the header and the pages. */
export function GameProvider({ children }: { children: ReactNode }) {
  const { state: auth } = useAuth();
  const signedIn = auth.status === "signed-in";
  const levels = useApiGet<Level[]>(signedIn ? "/api/v1/levels" : null);
  const quota = useApiGet<HintQuota>(signedIn ? "/api/v1/hints/quota" : null);
  const value = useMemo(
    () => ({
      levels: levels.state,
      reloadLevels: levels.reload,
      hintQuota: quota.state,
      reloadHintQuota: quota.reload,
    }),
    [levels.state, levels.reload, quota.state, quota.reload],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
