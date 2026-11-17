import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api";
import { useApiGet } from "../api/useApiGet";
import {
  BackButton,
  Badge,
  Button,
  Card,
  cx,
  ErrorState,
  LoadingState,
} from "../components";
import game from "../pages/Game.module.css";
import pages from "../pages/Pages.module.css";
import styles from "./Pattern.module.css";
import { LABEL_TEXT, LABEL_TONE } from "./types";
import type { AnswerResult, ChallengeView, Choice } from "./types";

const MIN_REASON = 10;

function Verdict({
  result,
  choices,
}: {
  result: AnswerResult;
  choices: Choice[];
}) {
  const mine = result.comparison.find((a) => a.id === result.approach);
  const best = result.comparison.find((a) => a.id === result.bestApproach);
  const name = (id: string) => choices.find((c) => c.id === id)?.name ?? id;
  return (
    <div className={cx(styles.verdict, styles[result.label])}>
      <strong>{LABEL_TEXT[result.label]}</strong>
      <p>
        {result.label === "best" && <>{mine?.why}</>}
        {result.label === "valid" && (
          <>
            It works. {mine?.why} A faster choice here is{" "}
            <strong>{name(result.bestApproach)}</strong> ({best?.time}).
          </>
        )}
        {result.label === "unsuitable" && (
          <>
            This approach does not solve this problem. {mine?.why} Try{" "}
            <strong>{name(result.bestApproach)}</strong> or another valid
            approach.
          </>
        )}
      </p>
    </div>
  );
}

function Result({
  result,
  choices,
}: {
  result: AnswerResult;
  choices: Choice[];
}) {
  return (
    <Card>
      <div className={styles.result} aria-live="polite">
        <Verdict result={result} choices={choices} />
        <div className={styles.score}>
          <span>Reasoning</span>
          <span className={styles.meter}>
            <span style={{ width: `${result.reasonScore}%` }} />
          </span>
          <strong>{result.reasonScore}/100</strong>
        </div>
        {result.feedback && <p className={game.note}>{result.feedback}</p>}
        <h2 className={game.sectionTitle}>How the approaches compare</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Approach</th>
                <th scope="col">Verdict</th>
                <th scope="col">Time</th>
                <th scope="col">Space</th>
                <th scope="col">Why</th>
              </tr>
            </thead>
            <tbody>
              {result.comparison.map((a) => (
                <tr
                  key={a.id}
                  className={a.id === result.approach ? styles.mine : undefined}
                >
                  <td>
                    {a.name}
                    {a.id === result.approach ? " (yours)" : ""}
                  </td>
                  <td>
                    <Badge tone={LABEL_TONE[a.label]}>
                      {LABEL_TEXT[a.label]}
                    </Badge>
                  </td>
                  <td data-k="Time">
                    <code>{a.time}</code>
                  </td>
                  <td data-k="Space">
                    <code>{a.space}</code>
                  </td>
                  <td>{a.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={game.note}>
          Pilot: no XP. Your answer is saved so the reviewer can check the AI
          feedback. {result.answersLeftToday} answers left today for this
          challenge.
        </p>
      </div>
    </Card>
  );
}

function Challenge({ challenge }: { challenge: ChallengeView }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [left, setLeft] = useState(challenge.answersLeftToday);

  const ready =
    choice !== null && reason.trim().length >= MIN_REASON && left > 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    setError(null);
    try {
      const answer = await api.post<AnswerResult>(
        `/api/v1/patterns/${challenge.id}/answers`,
        { approach: choice, explanation: reason.trim() },
      );
      setResult(answer);
      setLeft(answer.answersLeftToday);
    } catch (failure: unknown) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const again = () => {
    setResult(null);
    setChoice(null);
  };

  return (
    <>
      <Card>
        <div className={styles.statement}>
          <p>{challenge.statement}</p>
          <pre className={styles.examples}>{challenge.examples.join("\n")}</pre>
          {challenge.constraints.length > 0 && (
            <ul className={styles.constraints}>
              {challenge.constraints.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      </Card>
      <Card>
        <form className={styles.form} onSubmit={submit}>
          <fieldset
            className={styles.fieldset}
            disabled={result !== null || sending}
          >
            <legend>Which approach would you use?</legend>
            <div className={styles.options}>
              {challenge.approaches.map((a) => (
                <label
                  key={a.id}
                  className={cx(
                    styles.option,
                    choice === a.id && styles.chosen,
                  )}
                >
                  <input
                    type="radio"
                    name="approach"
                    value={a.id}
                    checked={choice === a.id}
                    onChange={() => setChoice(a.id)}
                  />
                  <span className={styles.optionName}>{a.name}</span>
                  <span className={styles.optionHint}>{a.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className={styles.label} htmlFor="pattern-reason">
            Why this approach?
          </label>
          <textarea
            id="pattern-reason"
            className={styles.textarea}
            value={reason}
            maxLength={1000}
            disabled={result !== null || sending}
            placeholder="Say what the approach does here, and its time complexity."
            onChange={(event) => setReason(event.target.value)}
          />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={pages.row}>
            {result ? (
              <Button
                type="button"
                variant="secondary"
                onClick={again}
                disabled={left <= 0}
              >
                Try another approach
              </Button>
            ) : (
              <Button type="submit" disabled={!ready || sending}>
                {sending ? "Checking…" : "Check my choice"}
              </Button>
            )}
            <span className={game.note}>
              {left <= 0
                ? "No answers left today for this challenge."
                : result
                  ? ""
                  : "Pick an approach and write at least a sentence."}
            </span>
          </div>
        </form>
      </Card>
      {result && <Result result={result} choices={challenge.approaches} />}
    </>
  );
}

/** One Pattern Recognition challenge (D-057). */
export function PatternPage() {
  const id = useParams().id ?? "";
  const view = useApiGet<ChallengeView>(`/api/v1/patterns/${id}`);
  const challenge = view.state.status === "ready" ? view.state.data : null;
  return (
    <div className={pages.page}>
      <div className={pages.topBar}>
        <BackButton
          to={challenge ? `/levels/${challenge.level}` : "/"}
          label="Back to the level"
        />
        {challenge && (
          <nav className={game.crumbs} aria-label="Breadcrumb">
            <Link to="/">Learning Path</Link> /{" "}
            <Link to={`/levels/${challenge.level}`}>
              Level {challenge.level}
            </Link>{" "}
            / <span>Pattern challenge</span>
          </nav>
        )}
      </div>
      <div className={styles.head}>
        <h1 className={pages.title}>
          {challenge?.title ?? "Pattern challenge"}
        </h1>
        <Badge tone="primary">Pilot · no XP</Badge>
      </div>
      {view.state.status === "loading" && (
        <LoadingState label="Loading challenge…" />
      )}
      {view.state.status === "error" && (
        <ErrorState message={view.state.message} onRetry={view.reload} />
      )}
      {challenge && <Challenge key={challenge.id} challenge={challenge} />}
    </div>
  );
}
