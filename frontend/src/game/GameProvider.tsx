import { useMemo } from "react";
import type { ReactNode } from "react";
import { useApiGet } from "../api/useApiGet";
import { useAuth } from "../auth";
import { GameContext } from "./gameContext";
import type { Level } from "./types";

/** Holds the signed-in player's levels, shared by the header and the pages. */
export function GameProvider({ children }: { children: ReactNode }) {
  const { state: auth } = useAuth();
  const signedIn = auth.status === "signed-in";
  const { state, reload } = useApiGet<Level[]>(
    signedIn ? "/api/v1/levels" : null,
  );
  const value = useMemo(
    () => ({ levels: state, reloadLevels: reload }),
    [state, reload],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
