import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n";
import { Link, useParams, useSearchParams } from "react-router";
import { api } from "../api";
import { useApiGet } from "../api/useApiGet";
import {
  BackButton,
  Badge,
  Card,
  ConfirmDialog,
  cx,
  ErrorState,
  LoadingState,
} from "../components";
import { useGame } from "../game/gameContext";
import type { Hints } from "../game/types";
import { InlineText } from "../lesson/Markdown";
import pages from "../pages/Pages.module.css";
import { ExplainForm } from "./ExplainForm";
import { CodePanel } from "../code/CodePanel";
import { FeedbackPanel, ResultActions } from "./FeedbackPanel";
import { HintPanel } from "./HintPanel";
import { clock, maxXp, timeLimitSeconds } from "./rules";
import type { GameRules } from "./rules";
import { ScoringGuide } from "./ScoringGuide";
import styles from "./Solve.module.css";
import type { AttemptMode, AttemptResult, ProblemDetail } from "./types";
import { drafts, useActiveTime } from "./useTimer";

function ProblemText({ problem }: { problem: ProblemDetail }) {
  const { t } = useTranslation();
  return (
    <Card>
      <p className={styles.statement}>
        <InlineText text={problem.statement} />
      </p>
      <h2 className={styles.subheading}>{t("solve.examples")}</h2>
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
      <h2 className={styles.subheading}>{t("solve.constraints")}</h2>
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

interface SolveProps {
  problem: ProblemDetail;
  mode: AttemptMode;
}

type View = "work" | "result";

function TimeNote({
  difficulty,
  seconds,
  rules,
}: {
  difficulty: ProblemDetail["difficulty"];
  seconds: number;
  rules: GameRules;
}) {
  const { t } = useTranslation();
  const limit = timeLimitSeconds(difficulty, rules);
  if (seconds > limit) {
    return (
      <p className={styles.timeNote} role="status">
        {t("solveMore.timeOver")} +{rules.timeBonus} {t("solveMore.bonus")}
      </p>
    );
  }
  return (
    <p className={styles.timeNote}>
      {t("solveMore.finishWithin")} {clock(limit)} {t("solveMore.activeTime")} +
      {rules.timeBonus} {t("solveMore.clockPauses")}
    </p>
  );
}

function Solve({ problem, mode }: SolveProps) {
  const { t, locale } = useTranslation();
  const practice = mode === "practice";
  const { reloadLevels, reloadHintQuota, rules } = useGame();
  const hintState = useApiGet<Hints>(
    practice ? null : `/api/v1/problems/${problem.id}/hints?lang=${locale}`,
  );
  const [hints, setHints] = useState<{ locale: string; data: Hints } | null>(null);
  const currentHints =
    (hints?.locale === locale ? hints.data : null) ??
    (hintState.state.status === "ready" ? hintState.state.data : null);
  const hintsUsed = currentHints?.opened.length ?? 0;

  const changeHints = (next: Hints) => {
    setHints({ locale, data: next });
    reloadHintQuota();
  };
  const [text, setText] = useState(() =>
    practice ? "" : drafts.read(problem.id),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A graded problem opens on its last result (D-042).
  const [result, setResult] = useState<AttemptResult | null>(
    practice ? null : problem.lastResult,
  );
  const [view, setView] = useState<View>(result ? "result" : "work");
  // Coming back to a problem with working time asks: continue or start again?
  const [asking, setAsking] = useState<"resume" | "retry" | null>(
    !practice && !problem.lastResult && problem.activeSeconds > 0
      ? "resume"
      : null,
  );
  const [restarting, setRestarting] = useState(false);
  // One ID per submitted text, so a retry of the same text is graded once.
  const attemptId = useRef<string | null>(null);
  const timed = !practice && view === "work" && asking === null;
  const [seconds, setSeconds] = useActiveTime(
    problem.id,
    problem.activeSeconds,
    timed,
  );
  const limit = timeLimitSeconds(problem.difficulty, rules);
  const over = seconds > limit;

  const changeText = (next: string) => {
    attemptId.current = null;
    setText(next);
    if (!practice) drafts.write(problem.id, next);
  };

  const startAgain = () => {
    setRestarting(true);
    api
      .post(`/api/v1/problems/${problem.id}/restart`)
      .then(() => {
        drafts.write(problem.id, "");
        setText("");
        setSeconds(0);
        setResult(null);
        setView("work");
        setAsking(null);
      })
      .catch((failure: unknown) => {
        setError(
          failure instanceof Error ? failure.message : t("common.error"),
        );
        setAsking(null);
      })
      .finally(() => setRestarting(false));
  };

  const submit = () => {
    attemptId.current ??= crypto.randomUUID();
    setSubmitting(true);
    setError(null);
    api
      .post<AttemptResult>(`/api/v1/problems/${problem.id}/attempts`, {
        attemptId: attemptId.current,
        text: text.trim(),
        mode,
      })
      .then((graded) => {
        attemptId.current = null;
        if (!practice) drafts.write(problem.id, "");
        setResult(graded);
        setView("result");
        reloadLevels();
      })
      .catch((failure: unknown) => {
        setError(
          failure instanceof Error ? failure.message : t("common.error"),
        );
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <>
      <div className={styles.titleRow}>
        <Badge tone="primary">{problem.difficulty}</Badge>
        {practice && <Badge tone="xp">{t("solve.practiceRound")}</Badge>}
        <h1 className={pages.title}>{problem.title}</h1>
        {!practice && view === "work" && (
          <span
            className={cx(styles.timer, over && styles.timerOver)}
            title={t("solve.activeTime")}
          >
            <strong>{clock(seconds)}</strong>
            {over
              ? ` · ${t("solveMore.timeBonusOver")}`
              : ` / ${clock(limit)} ${t("solveMore.timeBonus")}`}
          </span>
        )}
      </div>
      <div className={cx(styles.topRow, practice && styles.single)}>
        <ProblemText problem={problem} />
        {practice ? (
          <p className={styles.muted}>
            {t("solveMore.practiceIntro")} {rules.passScore}{" "}
            {t("solveMore.practiceEnd")} {rules.practiceDoneXp} XP.
          </p>
        ) : (
          currentHints && (
            <HintPanel
              hints={currentHints}
              problemId={problem.id}
              onChange={changeHints}
            />
          )
        )}
      </div>
      {view === "result" && result ? (
        <>
          <div className={styles.resultRow}>
            <Card
              heading={t("solveMore.yourAnswer")}
              className={styles.answerCard}
            >
              <p className={styles.answerText}>{result.explanation || text}</p>
            </Card>
            <FeedbackPanel result={result} level={problem.level} />
          </div>
          <ResultActions
            result={result}
            level={problem.level}
            nextProblemId={problem.nextProblemId}
            onRetry={practice ? undefined : () => setAsking("retry")}
          />
          {!practice && result.solved && problem.starterCode && (
            <CodePanel
              problemId={problem.id}
              starterCode={problem.starterCode}
            />
          )}
        </>
      ) : (
        <div className={styles.answerRow}>
          {!practice && (
            <TimeNote
              difficulty={problem.difficulty}
              seconds={seconds}
              rules={rules}
            />
          )}
          <ExplainForm
            xpNote={
              practice
                ? `${t("solveMore.doneUpTo")} ${rules.practiceDoneXp} XP`
                : `${t("solveMore.upTo")} ${maxXp(problem.difficulty, seconds, hintsUsed, rules)} XP`
            }
            text={text}
            onTextChange={changeText}
            submitting={submitting}
            error={error}
            onSubmit={submit}
          />
        </div>
      )}
      {!practice && <ScoringGuide />}
      {asking === "resume" && (
        <ConfirmDialog
          title={t("solve.resume")}
          confirmLabel={t("common.continue")}
          cancelLabel={t("solveMore.startAgain")}
          busy={restarting}
          onConfirm={() => setAsking(null)}
          onCancel={startAgain}
        >
          {t("solveMore.resumeInfo")} {clock(problem.activeSeconds)}{" "}
          {t("solveMore.resumeInfoTail")}
        </ConfirmDialog>
      )}
      {asking === "retry" && (
        <ConfirmDialog
          title={t("solve.retry")}
          confirmLabel={t("solveMore.retry")}
          cancelLabel={t("solveMore.retryKeep")}
          busy={restarting}
          onConfirm={startAgain}
          onCancel={() => setAsking(null)}
        >
          {t("solveMore.retryInfo")}
        </ConfirmDialog>
      )}
    </>
  );
}

/** Solve page (FR-04, FR-05): problem, explanation box, and result. */
export function SolvePage() {
  const { t, locale } = useTranslation();
  const { id } = useParams();
  const [params] = useSearchParams();
  const mode: AttemptMode =
    params.get("mode") === "practice" ? "practice" : "explain";
  const { state, reload } = useApiGet<ProblemDetail>(
    `/api/v1/problems/${id}?lang=${locale}`,
  );
  // Keep the current form mounted while the translated text is being fetched.
  const [previous, setPrevious] = useState<ProblemDetail | null>(null);
  useEffect(() => {
    if (state.status === "ready") setPrevious(state.data);
  }, [state]);
  const shown =
    state.status === "ready"
      ? state.data
      : previous?.id === id
        ? previous
        : null;
  const level = shown?.level ?? null;

  return (
    <div className={pages.page}>
      <div className={pages.topBar}>
        <BackButton
          to={level === null ? "/" : `/levels/${level}`}
          label={
            level === null
              ? t("profile.back")
              : `${t("lesson.backToLevel")} ${level}`
          }
        />
        <nav className={styles.crumbs} aria-label={t("level.breadcrumb")}>
          <Link to="/">{t("home.title")}</Link>
          {level !== null && (
            <>
              {" / "}
              <Link to={`/levels/${level}`}>Level {level}</Link>
            </>
          )}
        </nav>
      </div>
      {state.status === "loading" && !shown && (
        <LoadingState label={t("solve.loading")} />
      )}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {shown && (
        <Solve key={`${shown.id}-${mode}`} problem={shown} mode={mode} />
      )}
    </div>
  );
}
