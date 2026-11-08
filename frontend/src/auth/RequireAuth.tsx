import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { LoadingState } from "../components";
import { useAuth } from "./authContext";

/** Shows its content only to a signed-in user; others go to the sign-in page. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  if (state.status === "loading") {
    return <LoadingState label="Signing you in…" />;
  }
  if (state.status === "signed-out") {
    return <Navigate to="/sign-in" replace />;
  }
  return <>{children}</>;
}
