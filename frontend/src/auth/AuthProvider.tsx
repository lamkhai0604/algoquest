import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api";
import type { ApiClient } from "../api";
import { AuthContext } from "./authContext";
import type { AuthState, CurrentUser } from "./authContext";
import { clearSession, getToken, onSessionChange } from "./session";

const SIGNED_OUT: AuthState = { status: "signed-out", user: null };

const initialState = (): AuthState =>
  getToken() ? { status: "loading", user: null } : SIGNED_OUT;

interface AuthProviderProps {
  children: ReactNode;
  client?: ApiClient;
}

export function AuthProvider({ children, client = api }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  const refresh = useCallback(async () => {
    try {
      const user = await client.get<CurrentUser>("/api/v1/me");
      setState({ status: "signed-in", user });
    } catch {
      clearSession();
      setState(SIGNED_OUT);
    }
  }, [client]);

  useEffect(() => {
    if (getToken()) void refresh();
  }, [refresh]);

  useEffect(() => {
    return onSessionChange(() => {
      if (!getToken()) setState(SIGNED_OUT);
    });
  }, []);

  const signOut = useCallback(() => clearSession(), []);
  const value = useMemo(
    () => ({ state, refresh, signOut }),
    [state, refresh, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
