import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { useApiGet } from "../api/useApiGet";
import { useAuth } from "../auth";
import { GameContext } from "./gameContext";
import { DEFAULT_RULES } from "../solve/rules";
import type { GameRules } from "../solve/rules";
import type { HintQuota, Level, Profile } from "./types";

/** Holds the signed-in player's levels, shared by the header and the pages. */
export function GameProvider({ children }: { children: ReactNode }) {
  const { state: auth } = useAuth();
  const signedIn = auth.status === "signed-in";
  const levels = useApiGet<Level[]>(signedIn ? "/api/v1/levels" : null);
  const quota = useApiGet<HintQuota>(signedIn ? "/api/v1/hints/quota" : null);
  const profile = useApiGet<Profile>(signedIn ? "/api/v1/profile" : null);
  const rulesState = useApiGet<GameRules>(signedIn ? "/api/v1/rules" : null);
  const rules =
    rulesState.state.status === "ready" ? rulesState.state.data : DEFAULT_RULES;
  const reloadLevels = levels.reload;
  const reloadProfile = profile.reload;
  const reloadProgress = useCallback(() => {
    reloadLevels();
    reloadProfile();
  }, [reloadLevels, reloadProfile]);
  const value = useMemo(
    () => ({
      levels: levels.state,
      profile: profile.state,
      reloadLevels: reloadProgress,
      hintQuota: quota.state,
      reloadHintQuota: quota.reload,
      rules,
    }),
    [
      levels.state,
      profile.state,
      reloadProgress,
      quota.state,
      quota.reload,
      rules,
    ],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
