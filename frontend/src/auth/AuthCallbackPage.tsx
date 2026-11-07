import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api } from "../api";
import { ErrorState, LoadingState } from "../components";
import { useAuth } from "./authContext";
import { setSession } from "./session";
import type { Session } from "./session";

/** Receives the one-time code after the provider sign-in and trades it for a token. */
export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // A code works once, so the exchange must not run twice (React StrictMode runs effects twice).
    if (started.current) return;
    started.current = true;
    const code = params.get("code");
    api
      .post<Session>("/api/v1/auth/exchange", { code })
      .then(async (session) => {
        setSession(session);
        await refresh();
        navigate("/", { replace: true });
      })
      .catch(() => setFailed(true));
  }, [params, navigate, refresh]);

  if (failed) {
    return (
      <>
        <ErrorState
          title="Sign-in did not finish"
          message="The sign-in link expired or was already used."
        />
        <p style={{ textAlign: "center" }}>
          <Link to="/sign-in">Sign in again</Link>
        </p>
      </>
    );
  }
  return <LoadingState label="Signing you in…" />;
}
