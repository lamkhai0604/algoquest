import { useRef, useState } from "react";
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
import { FeedbackPanel, ResultActions } from "./FeedbackPanel";
import { HintPanel } from "./HintPanel";
import { clock, maxXp, TIME_BONUS, timeLimitSeconds } from "./rules";
import { ScoringGuide } from "./ScoringGuide";
import styles from "./Solve.module.css";
import type { AttemptMode, AttemptResult, ProblemDetail } from "./types";
import { drafts, useActiveTime } from "./useTimer";

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

interface SolveProps {
  problem: ProblemDetail;
  mode: AttemptMode;
}

type View = "work" | "result";

function TimeNote({
  difficulty,
  seconds,
}: {
  difficulty: ProblemDetail["difficulty"];
  seconds: number;
}) {
  const limit = timeLimitSeconds(difficulty);
  if (seconds > limit) {
    return (
      <p className={styles.timeNote} role="status">
        The time bonus is over. You can still solve this problem and earn its XP
        without the +{TIME_BONUS} bonus.
      </p>
    );
  }
  return (
    <p className={styles.timeNote}>
      Finish within {clock(limit)} of active time for +{TIME_BONUS} XP. The
      clock pauses when you leave this page.
    </p>
  );
}

function Solve({ problem, mode }: SolveProps) {
  const practice = mode === "practice";
  const { reloadLevels, reloadHintQuota } = useGame();
  const hintState = useApiGet<Hints>(
    practice ? null : `/api/v1/problems/${problem.id}/hints`,
  );
  const [hints, setHints] = useState<Hints | null>(null);
  const currentHints =
    hints ?? (hintState.state.status === "ready" ? hintState.state.data : null);
  const hintsUsed = currentHints?.opened.length ?? 0;

  const changeHints = (next: Hints) => {
    setHints(next);
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
  const limit = timeLimitSeconds(problem.difficulty);
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
          failure instanceof Error
            ? failure.message
            : "Something went wrong. Please try again.",
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
        {practice && <Badge tone="xp">Practice round</Badge>}
        <h1 className={pages.title}>{problem.title}</h1>
        {!practice && view === "work" && (
          <span
            className={cx(styles.timer, over && styles.timerOver)}
            title="Active time on this problem"
          >
            <strong>{clock(seconds)}</strong>
            {over ? " · time bonus over" : ` / ${clock(limit)} time bonus`}
          </span>
        )}
      </div>
      <div className={cx(styles.topRow, practice && styles.single)}>
        <ProblemText problem={problem} />
        {practice ? (
          <p className={styles.muted}>
            Explain the problem again without hints. A score of 70 or more marks
            it Done and adds up to 10 XP.
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
            <Card heading="Your answer" className={styles.answerCard}>
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
        </>
      ) : (
        <div className={styles.answerRow}>
          {!practice && (
            <TimeNote difficulty={problem.difficulty} seconds={seconds} />
          )}
          <ExplainForm
            xpNote={
              practice
                ? "Done adds up to 10 XP"
                : `Up to ${maxXp(problem.difficulty, seconds, hintsUsed)} XP`
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
          title="Continue where you left off?"
          confirmLabel="Continue"
          cancelLabel="Start again"
          busy={restarting}
          onConfirm={() => setAsking(null)}
          onCancel={startAgain}
        >
          You have {clock(problem.activeSeconds)} of active time on this
          problem. Continue keeps your draft and the clock; Start again clears
          both.
        </ConfirmDialog>
      )}
      {asking === "retry" && (
        <ConfirmDialog
          title="Retry this problem?"
          confirmLabel="Retry"
          cancelLabel="Keep my result"
          busy={restarting}
          onConfirm={startAgain}
          onCancel={() => setAsking(null)}
        >
          The answer box starts empty and the clock starts from zero. XP you
          already earned stays; a problem earns XP only once.
        </ConfirmDialog>
      )}
    </>
  );
}

/** Solve page (FR-04, FR-05): problem, explanation box, and result. */
export function SolvePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const mode: AttemptMode =
    params.get("mode") === "practice" ? "practice" : "explain";
  const { state, reload } = useApiGet<ProblemDetail>(`/api/v1/problems/${id}`);
  const level = state.status === "ready" ? state.data.level : null;

  return (
    <div className={pages.page}>
      <div className={pages.topBar}>
        <BackButton
          to={level === null ? "/" : `/levels/${level}`}
          label={
            level === null ? "Back to the level map" : `Back to Level ${level}`
          }
        />
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link to="/">Level map</Link>
          {level !== null && (
            <>
              {" / "}
              <Link to={`/levels/${level}`}>Level {level}</Link>
            </>
          )}
        </nav>
      </div>
      {state.status === "loading" && <LoadingState label="Loading problem…" />}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {state.status === "ready" && (
        <Solve
          key={`${state.data.id}-${mode}`}
          problem={state.data}
          mode={mode}
        />
      )}
    </div>
  );
}
