import { useEffect, useState } from "react";
import { useTranslation } from "../i18n";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { API_URL, ApiError, api, wakeServer } from "../api";
import { Card } from "../components";
import styles from "./Auth.module.css";
import { GraphBackground } from "./GraphBackground";
import { useAuth } from "./authContext";

const FEATURES = ["auth.feature1", "auth.feature2", "auth.feature3"] as const;

export function SignInPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [demoOn, setDemoOn] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const error =
    params.get("error") === "email-not-verified"
      ? t("auth.verify")
      : params.get("error")
        ? t("auth.error")
        : null;
  useEffect(() => {
    wakeServer();
    // The demo button shows only when the server offers it (D-062).
    api
      .get<{ demo: boolean }>("/api/v1/auth/options")
      .then((options) => setDemoOn(options.demo))
      .catch(() => setDemoOn(false));
  }, []);
  if (state.status === "signed-in") {
    return <Navigate to="/" replace />;
  }

  const tryDemo = () => {
    setDemoBusy(true);
    setDemoError(null);
    api
      .post<{ code: string }>("/api/v1/auth/demo")
      .then(({ code }) =>
        navigate(`/auth/callback?code=${encodeURIComponent(code)}`),
      )
      .catch((e: unknown) => {
        setDemoError(
          e instanceof ApiError && e.status === 429
            ? t("auth.demoUsedUp")
            : t("auth.error"),
        );
        setDemoBusy(false);
      });
  };

  return (
    <div className={styles.page}>
      <GraphBackground />
      <Card className={styles.card}>
        <h1 className={styles.title}>{t("auth.title")}</h1>
        <p className={styles.lead}>{t("auth.lead")}</p>
        <ul className={styles.features}>
          {FEATURES.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
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
        {demoOn && (
          <>
            <p className={styles.or}>{t("auth.or")}</p>
            <button
              type="button"
              className={styles.demo}
              onClick={tryDemo}
              disabled={demoBusy}
            >
              {t("auth.demo")}
            </button>
            <p className={styles.demoNote}>{t("auth.demoNote")}</p>
            {demoError && (
              <p className={styles.error} role="alert">
                {demoError}
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
