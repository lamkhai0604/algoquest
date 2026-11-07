import { createContext, useContext } from "react";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "signed-out"; user: null }
  | { status: "signed-in"; user: CurrentUser };

export interface AuthContextValue {
  state: AuthState;
  /** Reloads the signed-in user, for example right after sign-in. */
  refresh: () => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
