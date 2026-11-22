import { useState } from "react";
import { Link } from "react-router";
import { Badge, Card, cx } from "../components";
import { useTranslation } from "../i18n";
import lessonStyles from "../lesson/Lesson.module.css";
import { MarkdownBlocks } from "../lesson/Markdown";
import { parseMarkdown } from "../lesson/parseMarkdown";
import { QuickCheckQuestionCard } from "../lesson/QuickCheckQuestionCard";
import styles from "../pages/Pages.module.css";
import knowledgeStyles from "./Knowledge.module.css";
import questions from "./js-operators-check.json";
import operators from "./js-operators.json";

export function KnowledgePage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("nav.knowledge")}</h1>
      <Card>
        <h2 className={styles.planned}>JS</h2>
        <ul className={styles.topics}>
          <li>
            <Link to="/knowledge/js/operators">{t("nav.jsOperators")}</Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}

export function JsOperatorsPage() {
  const { locale, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"lesson" | "check">("lesson");
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const tabs = [
    { id: "lesson", label: t("nav.knowledgeLesson") },
    { id: "check", label: t("nav.knowledgeCheck") },
  ] as const;
  const lessonQuestions = questions[locale];
  const complete = lessonQuestions.every(
    (question, index) => picks[index] === question.answer,
  );

  return (
    <div className={styles.page}>
      <div>
        <Link to="/knowledge">{t("nav.knowledge")}</Link> / JS
      </div>
      <h1 className={styles.title}>{t("nav.jsOperators")}</h1>
      <div
        role="tablist"
        aria-label={t("nav.jsOperators")}
        className={cx(lessonStyles.steps, knowledgeStyles.tabs)}
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            id={`knowledge-${id}-tab`}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`knowledge-${id}-panel`}
            tabIndex={activeTab === id ? 0 : -1}
            className={cx(
              lessonStyles.stepTab,
              activeTab === id && lessonStyles.stepTabOn,
            )}
            onClick={() => setActiveTab(id)}
            onKeyDown={(event) => {
              const otherTab = id === "lesson" ? "check" : "lesson";
              const target = {
                ArrowLeft: otherTab,
                ArrowRight: otherTab,
                Home: "lesson",
                End: "check",
              } as const;
              if (!Object.hasOwn(target, event.key)) return;
              const next = target[event.key as keyof typeof target];
              event.preventDefault();
              setActiveTab(next);
              document.getElementById(`knowledge-${next}-tab`)?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        id="knowledge-lesson-panel"
        role="tabpanel"
        aria-labelledby="knowledge-lesson-tab"
        hidden={activeTab !== "lesson"}
        tabIndex={0}
      >
        <Card>
          <MarkdownBlocks blocks={parseMarkdown(operators[locale])} />
        </Card>
      </div>
      <div
        id="knowledge-check-panel"
        role="tabpanel"
        aria-labelledby="knowledge-check-tab"
        hidden={activeTab !== "check"}
        tabIndex={0}
      >
        <Card>
          {lessonQuestions.map((question, index) => (
            <QuickCheckQuestionCard
              key={index}
              question={question}
              number={index + 1}
              picked={picks[index] ?? null}
              locked={false}
              onPick={(option) =>
                setPicks((current) =>
                  lessonQuestions.map((_, item) =>
                    item === index ? option : (current[item] ?? null),
                  ),
                )
              }
            />
          ))}
          {complete && (
            <p className={lessonStyles.checkDone} role="status">
              <Badge tone="success">{t("lessonMore.quickCheckDone")}</Badge>
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
