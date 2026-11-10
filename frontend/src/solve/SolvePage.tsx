import { useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api";
import { useApiGet } from "../api/useApiGet";
import { Badge, Card, ErrorState, LoadingState } from "../components";
import { useGame } from "../game/gameContext";
import { InlineText } from "../lesson/Markdown";
import pages from "../pages/Pages.module.css";
import { ExplainForm } from "./ExplainForm";
import { FeedbackPanel } from "./FeedbackPanel";
import { clock, timeLimitSeconds } from "./rules";
import styles from "./Solve.module.css";
import type { AttemptResult, ProblemDetail } from "./types";
import { useTimer } from "./useTimer";

function ProblemText({ problem }: { problem: ProblemDetail }) {
  return (
    <Card>
      <p className={styles.statement}>
        <InlineText text={problem.statement} />
      </p>
      <h2 className={styles.subheading}>Examples</h2>
      <ul className={styles.examples}>
        {problem.examples.map((example, index) => (
          <li key={index}>
            <code>
              {example.input} → {example.output}
            </code>
            {example.explanation && <span>{example.explanation}</span>}
          </li>
        ))}
      </ul>
      <h2 className={styles.subheading}>Constraints</h2>
      <ul className={styles.constraints}>
        {problem.constraints.map((constraint) => (
          <li key={constraint}>
            <code>{constraint}</code>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Solve({ problem }: { problem: ProblemDetail }) {
  const { reloadLevels } = useGame();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  // One ID per submitted text, so a retry of the same text is graded once.
  const attemptId = useRef<string | null>(null);
  const seconds = useTimer(result === null);
  const limit = timeLimitSeconds(problem.difficulty);

  const changeText = (next: string) => {
    attemptId.current = null;
    setText(next);
  };

  const submit = () => {
    attemptId.current ??= crypto.randomUUID();
    setSubmitting(true);
    setError(null);
    api
      .post<AttemptResult>(`/api/v1/problems/${problem.id}/attempts`, {
        attemptId: attemptId.current,
        text: text.trim(),
        secondsTaken: seconds,
      })
      .then((graded) => {
        attemptId.current = null;
        setResult(graded);
        reloadLevels();
      })
      .catch((failure: unknown) => {
        setError(
          failure instanceof Error
            ? failure.message
            : "Something went wrong. Please try again.",
        );
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <>
      <div className={styles.titleRow}>
        <Badge tone="primary">{problem.difficulty}</Badge>
        <h1 className={pages.title}>{problem.title}</h1>
        <span className={styles.timer} title="Time on this problem">
          <strong>{clock(seconds)}</strong> / {clock(limit)} time bonus
        </span>
      </div>
      <div className={styles.columns}>
        <ProblemText problem={problem} />
        {result ? (
          <FeedbackPanel
            result={result}
            level={problem.level}
            onTryAgain={() => setResult(null)}
          />
        ) : (
          <ExplainForm
            difficulty={problem.difficulty}
            seconds={seconds}
            text={text}
            onTextChange={changeText}
            submitting={submitting}
            error={error}
            onSubmit={submit}
          />
        )}
      </div>
    </>
  );
}

/** Solve page (FR-04, FR-05): problem, explanation box, and result. */
export function SolvePage() {
  const { id } = useParams();
  const { state, reload } = useApiGet<ProblemDetail>(`/api/v1/problems/${id}`);
  const level = state.status === "ready" ? state.data.level : null;

  return (
    <div className={pages.page}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/">Level map</Link>
        {level !== null && (
          <>
            {" / "}
            <Link to={`/levels/${level}`}>Level {level}</Link>
          </>
        )}
      </nav>
      {state.status === "loading" && <LoadingState label="Loading problem…" />}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {state.status === "ready" && (
        <Solve key={state.data.id} problem={state.data} />
      )}
    </div>
  );
}
