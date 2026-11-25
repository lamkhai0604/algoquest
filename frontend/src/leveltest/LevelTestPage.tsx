import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n";
import { Link, useParams } from "react-router";
import { api } from "../api";
import { useApiGet } from "../api/useApiGet";
import {
  Badge,
  Button,
  BackButton,
  ButtonLink,
  Card,
  ErrorState,
  LoadingState,
} from "../components";
import { levelLabel } from "../game/levelLabel";
import { useGame } from "../game/gameContext";
import { InlineText } from "../lesson/Markdown";
import pages from "../pages/Pages.module.css";
import { clock, MAX_LENGTH } from "../solve/rules";
import { ScoringGuide } from "../solve/ScoringGuide";
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
  const { t } = useTranslation();
  const { rules } = useGame();
  const next = test.nextLevelState;
  const unlock =
    next === "OPEN"
      ? `${t("common.level")} ${test.level + 1} ${t("testMore.levelOpen")}`
      : next === "EASY_ONLY"
        ? `${t("common.level")} ${test.level + 1}${t("testMore.easyOpen")}`
        : `${t("testMore.scoreTo")} ${rules.passScore} ${t("testMore.scoreToTail")}`;
  return (
    <>
      <Card className={styles.score}>
        <Badge
          tone={(test.score ?? 0) >= rules.passScore ? "success" : "warning"}
        >
          {(test.score ?? 0) >= rules.passScore
            ? t("testMore.passed")
            : t("testMore.notPassed")}
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
                ? t("testMore.notGraded")
                : t("testMore.noAnswer")}
          </p>
          {result && <p className={styles.feedback}>{result.feedback}</p>}
        </Card>
      ))}
      <div className={styles.actions}>
        <ButtonLink to={`/levels/${test.level}`}>
          {t("testMore.backLevel")}
        </ButtonLink>
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
  const { t, locale } = useTranslation();
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
        .post<LevelTest>(`/api/v1/tests/${test.id}/answers?lang=${locale}`, {
          problemId,
          text,
        })
        .then(() => setSaved((s) => ({ ...s, [problemId]: text }))),
    [test.id, locale],
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
      onSubmitted(
        await api.post<LevelTest>(
          `/api/v1/tests/${test.id}/submit?lang=${locale}`,
        ),
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("common.retry"));
      setSubmitting(false);
    }
  }, [answers, saved, save, onSubmitted, test.id, timeUp, t, locale]);

  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (timeUp && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submit();
    }
  }, [timeUp, submit]);

  return (
    <>
      <p className={styles.timer} title={t("testMore.timeLeft")}>
        <strong>{clock(left)}</strong> {t("testMore.left")}
      </p>
      {test.problems.map(({ problem }, index) => {
        const text = answers[problem.id] ?? "";
        const state =
          text === saved[problem.id]
            ? text
              ? t("testMore.saved")
              : ""
            : t("testMore.saving");
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
              {t("solveMore.explanation")}
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
          {submitting ? t("testMore.grading") : t("testMore.submit")}
        </Button>
      </div>
    </>
  );
}

/** Level-up test page (FR-10). */
export function LevelTestPage() {
  const { t, locale } = useTranslation();
  const { id } = useParams();
  const { reloadLevels } = useGame();
  const { state, reload } = useApiGet<LevelTest>(
    `/api/v1/tests/${id}?lang=${locale}`,
    api,
    true,
  );
  const [submitted, setSubmitted] = useState<{
    locale: string;
    data: LevelTest;
  } | null>(null);
  // Keep unsaved answers mounted when a learner switches language mid-test.
  const test =
    submitted?.locale === locale
      ? submitted.data
      : state.status === "ready"
        ? state.data
        : null;

  const onSubmitted = useCallback(
    (result: LevelTest) => {
      setSubmitted({ locale, data: result });
      reloadLevels();
    },
    [reloadLevels, locale],
  );

  return (
    <div className={pages.page}>
      <div className={pages.topBar}>
        <BackButton
          to={test ? `/levels/${test.level}` : "/"}
          label={
            test
              ? `${t("lesson.backToLevel")} ${levelLabel(test.level)}`
              : t("profile.back")
          }
        />
        <nav className={styles.crumbs} aria-label={t("level.breadcrumb")}>
          <Link to="/">{t("home.title")}</Link>
          {test && (
            <>
              {" / "}
              <Link to={`/levels/${test.level}`}>Level {test.level}</Link>
            </>
          )}
        </nav>
      </div>
      <h1 className={pages.title}>
        {test
          ? `${t("common.level")} ${test.level} ${t("testMore.testWord")}`
          : t("testMore.levelTest")}
      </h1>
      {!test && state.status === "loading" && (
        <LoadingState label={t("testMore.loading")} />
      )}
      {!test && state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {test && test.status === "submitted" && <Result test={test} />}
      {test && test.status !== "submitted" && (
        <RunningTest test={test} onSubmitted={onSubmitted} />
      )}
      {test && <ScoringGuide variant="test" />}
    </div>
  );
}
