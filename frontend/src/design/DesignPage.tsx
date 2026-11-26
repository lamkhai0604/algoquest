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
  ErrorState,
  LoadingState,
} from "../components";
import { levelLabel } from "../game/levelLabel";
import { useTranslation } from "../i18n";
import type { TranslationKey } from "../i18n";
import game from "../pages/Game.module.css";
import pages from "../pages/Pages.module.css";
import pattern from "../pattern/Pattern.module.css";
import styles from "./Design.module.css";
import type {
  DesignAnswer,
  DesignForm,
  DesignResult,
  DesignSection,
  PromptView,
  Reference,
} from "./types";

const MIN_SECTION = 10;
const MAX_SECTION = 2000;

/** Label and hint for each heading, by the prompt's form. */
const HEADINGS: Record<
  DesignForm,
  Partial<Record<DesignSection, [TranslationKey, TranslationKey]>>
> = {
  scaffold: {
    requirements: ["design.section_requirements", "design.hint_requirements"],
    estimate: ["design.section_estimate", "design.hint_estimate"],
    components: ["design.section_components", "design.hint_components"],
    failure: ["design.section_failure", "design.hint_failure"],
  },
  routine: {
    requirements: ["design.routine_requirements", "design.routineHint_requirements"],
    estimate: ["design.routine_estimate", "design.routineHint_estimate"],
    api: ["design.routine_api", "design.routineHint_api"],
    data: ["design.routine_data", "design.routineHint_data"],
    design: ["design.routine_design", "design.routineHint_design"],
    deepdive: ["design.routine_deepdive", "design.routineHint_deepdive"],
    failures: ["design.routine_failures", "design.routineHint_failures"],
    summary: ["design.routine_summary", "design.routineHint_summary"],
  },
};

function headingKeys(form: DesignForm, section: DesignSection) {
  return HEADINGS[form][section] ?? HEADINGS.scaffold.requirements!;
}

function ReferenceDesign({ reference }: { reference: Reference }) {
  const { t } = useTranslation();
  return (
    <div className={styles.reference}>
      <p className={game.note}>{t("design.referenceNote")}</p>
      <h3>{t("design.assumptions")}</h3>
      <ul>
        {reference.assumptions.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <h3>{t("design.referenceDesign")}</h3>
      {reference.design.split("\n").map((line, index) => (
        <p key={index}>{line}</p>
      ))}
      <h3>{t("design.alternatives")}</h3>
      <ul>
        {reference.alternatives.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </div>
  );
}

function Result({ result }: { result: DesignResult }) {
  const { t } = useTranslation();
  const [showReference, setShowReference] = useState(false);
  return (
    <Card heading={t("design.feedback")}>
      <div className={pattern.result} aria-live="polite">
        <p className={styles.total}>
          {t("design.total")} <strong>{result.total}/100</strong>
        </p>
        <ul className={styles.categories}>
          {result.categories.map((c) => (
            <li key={c.category} className={styles.category}>
              <span>{t(`design.cat_${c.category}`)}</span>
              <span className={pattern.meter}>
                <span style={{ width: `${(c.points / c.max) * 100}%` }} />
              </span>
              <strong>
                {c.points}/{c.max}
              </strong>
            </li>
          ))}
        </ul>
        <dl className={styles.feedback}>
          {result.strengths && (
            <>
              <dt>{t("design.strengths")}</dt>
              <dd>{result.strengths}</dd>
            </>
          )}
          {result.improve && (
            <>
              <dt>{t("design.improve")}</dt>
              <dd>{result.improve}</dd>
            </>
          )}
        </dl>
        {showReference ? (
          <ReferenceDesign reference={result.reference} />
        ) : (
          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowReference(true)}
            >
              {t("design.showReference")}
            </Button>
          </div>
        )}
        <p className={game.note}>
          {t("design.noXpNote")} {result.answersLeftToday}{" "}
          {t("design.answersLeft")}
        </p>
      </div>
    </Card>
  );
}

function Prompt({ prompt }: { prompt: PromptView }) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState<DesignAnswer>({});
  const text = (section: DesignSection) => answer[section] ?? "";
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DesignResult | null>(null);
  const [left, setLeft] = useState(prompt.answersLeftToday);

  const ready =
    prompt.sections.every(
      (section) => text(section).trim().length >= MIN_SECTION,
    ) && left > 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    setError(null);
    try {
      const graded = await api.post<DesignResult>(
        `/api/v1/designs/${prompt.id}/answers`,
        {
          sections: Object.fromEntries(
            prompt.sections.map((section) => [section, text(section).trim()]),
          ),
        },
      );
      setResult(graded);
      setLeft(graded.answersLeftToday);
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : t("design.error"));
    } finally {
      setSending(false);
    }
  };

  const set = (section: DesignSection, value: string) =>
    setAnswer((current) => ({ ...current, [section]: value }));

  return (
    <>
      <Card>
        <div className={pattern.statement}>
          <p>{prompt.prompt}</p>
          <h2 className={game.sectionTitle}>{t("design.facts")}</h2>
          <ul className={pattern.constraints}>
            {prompt.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
          <h2 className={game.sectionTitle}>{t("design.scope")}</h2>
          <ul className={pattern.constraints}>
            {prompt.scope.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </Card>
      <Card>
        <form className={pattern.form} onSubmit={submit}>
          <div className={styles.sections}>
            {prompt.sections.map((section) => (
              <div key={section} className={styles.section}>
                <label htmlFor={`design-${section}`}>
                  {t(headingKeys(prompt.form, section)[0])}
                </label>
                <p className={styles.sectionHint} id={`design-${section}-hint`}>
                  {t(headingKeys(prompt.form, section)[1])}
                </p>
                <textarea
                  id={`design-${section}`}
                  aria-describedby={`design-${section}-hint`}
                  className={pattern.textarea}
                  value={text(section)}
                  maxLength={MAX_SECTION}
                  disabled={result !== null || sending}
                  onChange={(event) => set(section, event.target.value)}
                />
              </div>
            ))}
          </div>
          {error && (
            <p className={pattern.error} role="alert">
              {error}
            </p>
          )}
          <div className={pages.row}>
            {result ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setResult(null)}
                disabled={left <= 0}
              >
                {t("design.editAgain")}
              </Button>
            ) : (
              <Button type="submit" disabled={!ready || sending}>
                {sending ? t("design.checking") : t("design.submit")}
              </Button>
            )}
            <span className={game.note}>
              {left <= 0
                ? t("design.noAnswers")
                : result
                  ? ""
                  : t("design.fillEvery")}
            </span>
          </div>
        </form>
      </Card>
      {result && <Result result={result} />}
    </>
  );
}

/** One design prompt (D-085). */
export function DesignPage() {
  const { t } = useTranslation();
  const id = useParams().id ?? "";
  const view = useApiGet<PromptView>(`/api/v1/designs/${id}`);
  const prompt = view.state.status === "ready" ? view.state.data : null;
  return (
    <div className={pages.page}>
      <div className={pages.topBar}>
        <BackButton
          to={prompt ? `/levels/${prompt.level}` : "/"}
          label={t("pattern.backLevel")}
        />
        {prompt && (
          <nav className={game.crumbs} aria-label={t("level.breadcrumb")}>
            <Link to="/">{t("nav.map")}</Link> /{" "}
            <Link to={`/levels/${prompt.level}`}>
              {levelLabel(prompt.level)}
            </Link>{" "}
            / <span>{t("design.prompt")}</span>
          </nav>
        )}
      </div>
      <div className={pattern.head}>
        <h1 className={pages.title}>{prompt?.title ?? t("design.prompt")}</h1>
        <Badge tone="primary">{t("design.pilot")}</Badge>
      </div>
      {view.state.status === "loading" && (
        <LoadingState label={t("design.loading")} />
      )}
      {view.state.status === "error" && (
        <ErrorState message={view.state.message} onRetry={view.reload} />
      )}
      {prompt && <Prompt key={prompt.id} prompt={prompt} />}
    </div>
  );
}
