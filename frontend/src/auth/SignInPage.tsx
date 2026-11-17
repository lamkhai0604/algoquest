import { useEffect } from "react";
import { useTranslation } from "../i18n";
import { Navigate, useSearchParams } from "react-router";
import { API_URL, wakeServer } from "../api";
import { Card } from "../components";
import styles from "./Auth.module.css";
import { GraphBackground } from "./GraphBackground";
import { useAuth } from "./authContext";

export function SignInPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { state } = useAuth();
  const error =
    params.get("error") === "email-not-verified"
      ? t("auth.verify")
      : params.get("error")
        ? t("auth.error")
        : null;
  useEffect(() => {
    wakeServer();
  }, []);
  if (state.status === "signed-in") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.page}>
      <GraphBackground />
      <Card className={styles.card}>
        <h1 className={styles.title}>{t("auth.title")}</h1>
        <p className={styles.lead}>{t("auth.lead")}</p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <a
          className={styles.provider}
          href={`${API_URL}/oauth2/authorization/google`}
        >
          {t("auth.google")}
        </a>
        <a
          className={styles.provider}
          href={`${API_URL}/oauth2/authorization/github`}
        >
          {t("auth.github")}
        </a>
      </Card>
    </div>
  );
}
