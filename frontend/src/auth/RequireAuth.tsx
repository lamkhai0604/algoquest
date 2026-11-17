import type { ReactNode } from "react";
import { useTranslation } from "../i18n";
import { Navigate } from "react-router";
import { LoadingState } from "../components";
import { useAuth } from "./authContext";

/** Shows its content only to a signed-in user; others go to the sign-in page. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const { t } = useTranslation();
  if (state.status === "loading") {
    return <LoadingState label={t("common.signing")} />;
  }
  if (state.status === "signed-out") {
    return <Navigate to="/sign-in" replace />;
  }
  return <>{children}</>;
}
