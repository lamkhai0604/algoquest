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
import { LABEL_TONE } from "./types";
import { useTranslation } from "../i18n";
import type { AnswerResult, ChallengeView, Choice } from "./types";
import { levelLabel } from "../game/levelLabel";
import { useShuffledOrder } from "../lesson/shuffle";

const MIN_REASON = 10;

function Verdict({
  result,
  choices,
}: {
  result: AnswerResult;
  choices: Choice[];
}) {
  const { t } = useTranslation();
  const mine = result.comparison.find((a) => a.id === result.approach);
  const best = result.comparison.find((a) => a.id === result.bestApproach);
  const name = (id: string) => choices.find((c) => c.id === id)?.name ?? id;
  return (
    <div className={cx(styles.verdict, styles[result.label])}>
      <strong>{t(`pattern.${result.label}`)}</strong>
      <p>
        {result.label === "best" && <>{mine?.why}</>}
        {result.label === "valid" && (
          <>
            {t("pattern.itWorks")} {mine?.why} {t("pattern.faster")}{" "}
            <strong>{name(result.bestApproach)}</strong> ({best?.time}).
          </>
        )}
        {result.label === "unsuitable" && (
          <>
            {t("pattern.notSuitable")} {mine?.why} {t("pattern.try")}{" "}
            <strong>{name(result.bestApproach)}</strong>{" "}
            {t("pattern.otherValid")}
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
  const { t } = useTranslation();
  return (
    <Card>
      <div className={styles.result} aria-live="polite">
        <Verdict result={result} choices={choices} />
        <div className={styles.score}>
          <span>{t("pattern.reasoning")}</span>
          <span className={styles.meter}>
            <span style={{ width: `${result.reasonScore}%` }} />
          </span>
          <strong>{result.reasonScore}/100</strong>
        </div>
        {result.feedback && <p className={game.note}>{result.feedback}</p>}
        <h2 className={game.sectionTitle}>{t("pattern.compare")}</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t("pattern.approach")}</th>
                <th scope="col">{t("pattern.verdict")}</th>
                <th scope="col">{t("pattern.time")}</th>
                <th scope="col">{t("pattern.space")}</th>
                <th scope="col">{t("pattern.why")}</th>
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
                    {a.id === result.approach ? ` ${t("pattern.yours")}` : ""}
                  </td>
                  <td>
                    <Badge tone={LABEL_TONE[a.label]}>
                      {t(`pattern.${a.label}`)}
                    </Badge>
                  </td>
                  <td data-k={t("pattern.time")}>
                    <code>{a.time}</code>
                  </td>
                  <td data-k={t("pattern.space")}>
                    <code>{a.space}</code>
                  </td>
                  <td>{a.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={game.note}>
          {t("pattern.noXpNote")} {result.answersLeftToday}{" "}
          {t("pattern.answersLeft")}
        </p>
      </div>
    </Card>
  );
}

function Challenge({ challenge }: { challenge: ChallengeView }) {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [left, setLeft] = useState(challenge.answersLeftToday);
  const order = useShuffledOrder(challenge.approaches.length, challenge.id);

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
      setError(failure instanceof Error ? failure.message : t("pattern.error"));
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
            <legend>{t("pattern.whichApproach")}</legend>
            <div className={styles.options}>
              {order
                .map((index) => challenge.approaches[index]!)
                .map((a) => (
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
            {t("pattern.whyApproach")}
          </label>
          <textarea
            id="pattern-reason"
            className={styles.textarea}
            value={reason}
            maxLength={1000}
            disabled={result !== null || sending}
            placeholder={t("pattern.reasonPlaceholder")}
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
                {t("pattern.tryAnother")}
              </Button>
            ) : (
              <Button type="submit" disabled={!ready || sending}>
                {sending ? t("pattern.checking") : t("pattern.checkChoice")}
              </Button>
            )}
            <span className={game.note}>
              {left <= 0
                ? t("pattern.noAnswers")
                : result
                  ? ""
                  : t("pattern.writeSentence")}
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
  const { t } = useTranslation();
  const id = useParams().id ?? "";
  const view = useApiGet<ChallengeView>(`/api/v1/patterns/${id}`);
  const challenge = view.state.status === "ready" ? view.state.data : null;
  return (
    <div className={pages.page}>
      <div className={pages.topBar}>
        <BackButton
          to={challenge ? `/levels/${challenge.level}` : "/"}
          label={t("pattern.backLevel")}
        />
        {challenge && (
          <nav className={game.crumbs} aria-label={t("level.breadcrumb")}>
            <Link to="/">{t("nav.map")}</Link> /{" "}
            <Link to={`/levels/${challenge.level}`}>
              {levelLabel(challenge.level)}
            </Link>{" "}
            / <span>{t("pattern.challenge")}</span>
          </nav>
        )}
      </div>
      <div className={styles.head}>
        <h1 className={pages.title}>
          {challenge?.title ?? t("pattern.challenge")}
        </h1>
        <Badge tone="primary">{t("pattern.pilot")}</Badge>
      </div>
      {view.state.status === "loading" && (
        <LoadingState label={t("pattern.loading")} />
      )}
      {view.state.status === "error" && (
        <ErrorState message={view.state.message} onRetry={view.reload} />
      )}
      {challenge && <Challenge key={challenge.id} challenge={challenge} />}
    </div>
  );
}
