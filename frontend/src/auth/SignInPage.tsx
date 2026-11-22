import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "../i18n";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { API_URL, ApiError, api, wakeServer } from "../api";
import { Card } from "../components";
import styles from "./Auth.module.css";
import { GraphBackground } from "./GraphBackground";
import { useAuth } from "./authContext";

const FEATURES = ["auth.feature1", "auth.feature2", "auth.feature3"] as const;

/** Which sign-in methods the server offers (D-062, D-073). */
type Options = { demo: boolean; oauth: boolean; password: boolean };

export function SignInPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [options, setOptions] = useState<Options | null>(null);
  const [optionsFailed, setOptionsFailed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
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
    // Each sign-in method shows only when the server offers it (D-062, D-073).
    api
      .get<Options>("/api/v1/auth/options")
      .then(setOptions)
      .catch(() => setOptionsFailed(true));
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

  const signInWithPassword = (event: FormEvent) => {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordError(null);
    api
      .post<{ code: string }>("/api/v1/auth/password", { email, password })
      .then(({ code }) =>
        navigate(`/auth/callback?code=${encodeURIComponent(code)}`),
      )
      .catch((e: unknown) => {
        setPasswordError(
          e instanceof ApiError && e.status === 401
            ? t("auth.wrongPassword")
            : e instanceof ApiError && e.status === 429
              ? t("auth.tooManyAttempts")
              : t("auth.error"),
        );
        setPasswordBusy(false);
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
        {!options && !optionsFailed && (
          <p className={styles.demoNote}>{t("auth.loadingOptions")}</p>
        )}
        {optionsFailed && <p className={styles.error}>{t("auth.error")}</p>}
        {options?.password && (
          <form className={styles.passwordForm} onSubmit={signInWithPassword}>
            <label className={styles.field}>
              <span>{t("auth.email")}</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>{t("auth.password")}</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {passwordError && (
              <p className={styles.error} role="alert">
                {passwordError}
              </p>
            )}
            <button
              type="submit"
              className={styles.signInButton}
              disabled={passwordBusy}
            >
              {t("auth.signIn")}
            </button>
          </form>
        )}
        {options?.oauth && (
          <>
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
          </>
        )}
        {options?.demo && (
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
