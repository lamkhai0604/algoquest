import { Navigate, useSearchParams } from "react-router";
import { API_URL } from "../api";
import { Card } from "../components";
import styles from "./Auth.module.css";
import { useAuth } from "./authContext";

const ERRORS: Record<string, string> = {
  "email-not-verified":
    "Your account has no verified email address. Verify it with the provider and try again.",
};
const DEFAULT_ERROR = "Sign-in did not finish. Please try again.";

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  return ERRORS[code] ?? DEFAULT_ERROR;
}

export function SignInPage() {
  const [params] = useSearchParams();
  const { state } = useAuth();
  const error = errorMessage(params.get("error"));
  if (state.status === "signed-in") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Sign in to AlgoQuest</h1>
        <p className={styles.lead}>Don&apos;t let Algorithm beat you.</p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <a
          className={styles.provider}
          href={`${API_URL}/oauth2/authorization/google`}
        >
          Continue with Google
        </a>
        <a
          className={styles.provider}
          href={`${API_URL}/oauth2/authorization/github`}
        >
          Continue with GitHub
        </a>
      </Card>
    </div>
  );
}
