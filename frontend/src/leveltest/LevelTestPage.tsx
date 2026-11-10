import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api";
import { useApiGet } from "../api/useApiGet";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ErrorState,
  LoadingState,
} from "../components";
import { useGame } from "../game/gameContext";
import { InlineText } from "../lesson/Markdown";
import pages from "../pages/Pages.module.css";
import { clock, MAX_LENGTH } from "../solve/rules";
import styles from "./LevelTest.module.css";
import type { LevelTest } from "./types";
import { totalOf } from "./types";

const SAVE_DELAY_MS = 1000;

/** Seconds left, counted with the server's clock. */
function useSecondsLeft(test: LevelTest): number {
  const endsAt = new Date(test.endsAt).getTime();
  const serverTime = new Date(test.serverTime).getTime();
  const [left, setLeft] = useState(() =>
    Math.max(0, Math.floor((endsAt - serverTime) / 1000)),
  );
  useEffect(() => {
    // The difference between the server's clock and this device's clock.
    const offset = serverTime - Date.now();
    const tick = () =>
      setLeft(Math.max(0, Math.floor((endsAt - (Date.now() + offset)) / 1000)));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, serverTime]);
  return left;
}

function Result({ test }: { test: LevelTest }) {
  const next = test.nextLevelState;
  const unlock =
    next === "OPEN"
      ? `Level ${test.level + 1} is open.`
      : next === "EASY_ONLY"
        ? `Level ${test.level + 1}: Easy problems are open. Score 100 to open the rest.`
        : "Score 70 or more to open the next level. You can retake the test.";
  return (
    <>
      <Card className={styles.score}>
        <Badge tone={(test.score ?? 0) >= 70 ? "success" : "warning"}>
          {(test.score ?? 0) >= 70 ? "Passed" : "Not passed yet"}
        </Badge>
        <p className={styles.total}>
          <strong>{test.score}</strong> / 100
        </p>
        <p className={styles.muted}>{unlock}</p>
      </Card>
      {test.problems.map(({ problem, answer, result }) => (
        <Card key={problem.id} heading={problem.title}>
          <p className={styles.muted}>
            {result
              ? `${totalOf(result)} / 100`
              : answer
                ? "Not graded"
                : "No answer: 0 / 100"}
          </p>
          {result && <p className={styles.feedback}>{result.feedback}</p>}
        </Card>
      ))}
      <div className={styles.actions}>
        <ButtonLink to={`/levels/${test.level}`}>Back to the level</ButtonLink>
      </div>
    </>
  );
}

function RunningTest({
  test,
  onSubmitted,
}: {
  test: LevelTest;
  onSubmitted: (test: LevelTest) => void;
}) {
  const left = useSecondsLeft(test);
  const timeUp = test.status === "timeUp" || left === 0;
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(test.problems.map((p) => [p.problem.id, p.answer])),
  );
  const [saved, setSaved] = useState<Record<string, string>>(answers);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const save = useCallback(
    (problemId: string, text: string) =>
      api
        .post<LevelTest>(`/api/v1/tests/${test.id}/answers`, {
          problemId,
          text,
        })
        .then(() => setSaved((s) => ({ ...s, [problemId]: text }))),
    [test.id],
  );

  const change = (problemId: string, text: string) => {
    setAnswers((a) => ({ ...a, [problemId]: text }));
    clearTimeout(timers.current[problemId]);
    timers.current[problemId] = setTimeout(() => {
      save(problemId, text).catch(() => undefined);
    }, SAVE_DELAY_MS);
  };

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    Object.values(timers.current).forEach(clearTimeout);
    try {
      if (!timeUp) {
        for (const [problemId, text] of Object.entries(answers)) {
          if (text !== saved[problemId]) await save(problemId, text);
        }
      }
      onSubmitted(await api.post<LevelTest>(`/api/v1/tests/${test.id}/submit`));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Try again.");
      setSubmitting(false);
    }
  }, [answers, saved, save, onSubmitted, test.id, timeUp]);

  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (timeUp && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submit();
    }
  }, [timeUp, submit]);

  return (
    <>
      <p className={styles.timer} title="Time left">
        <strong>{clock(left)}</strong> left
      </p>
      {test.problems.map(({ problem }, index) => {
        const text = answers[problem.id] ?? "";
        const state =
          text === saved[problem.id] ? (text ? "Saved" : "") : "Saving…";
        return (
          <Card key={problem.id}>
            <h2 className={styles.problemTitle}>
              {index + 1}. {problem.title}{" "}
              <Badge tone="primary">{problem.difficulty}</Badge>
            </h2>
            <p className={styles.statement}>
              <InlineText text={problem.statement} />
            </p>
            <ul className={styles.examples}>
              {problem.examples.map((example, i) => (
                <li key={i}>
                  <code>
                    {example.input} → {example.output}
                  </code>
                </li>
              ))}
            </ul>
            <label className={styles.label} htmlFor={`answer-${problem.id}`}>
              Your explanation
            </label>
            <textarea
              id={`answer-${problem.id}`}
              className={styles.textarea}
              rows={6}
              maxLength={MAX_LENGTH}
              value={text}
              disabled={timeUp || submitting}
              onChange={(event) => change(problem.id, event.target.value)}
            />
            <span className={styles.muted}>{state}</span>
          </Card>
        );
      })}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button onClick={() => void submit()} disabled={submitting}>
          {submitting ? "Grading your answers…" : "Submit the test"}
        </Button>
      </div>
    </>
  );
}

/** Level-up test page (FR-10). */
export function LevelTestPage() {
  const { id } = useParams();
  const { reloadLevels } = useGame();
  const { state, reload } = useApiGet<LevelTest>(`/api/v1/tests/${id}`);
  const [submitted, setSubmitted] = useState<LevelTest | null>(null);
  const test = submitted ?? (state.status === "ready" ? state.data : null);

  const onSubmitted = useCallback(
    (result: LevelTest) => {
      setSubmitted(result);
      reloadLevels();
    },
    [reloadLevels],
  );

  return (
    <div className={pages.page}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/">Level map</Link>
        {test && (
          <>
            {" / "}
            <Link to={`/levels/${test.level}`}>Level {test.level}</Link>
          </>
        )}
      </nav>
      <h1 className={pages.title}>
        {test ? `Level ${test.level} test` : "Level-up test"}
      </h1>
      {!test && state.status === "loading" && (
        <LoadingState label="Loading the test…" />
      )}
      {!test && state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {test && test.status === "submitted" && <Result test={test} />}
      {test && test.status !== "submitted" && (
        <RunningTest test={test} onSubmitted={onSubmitted} />
      )}
    </div>
  );
}
