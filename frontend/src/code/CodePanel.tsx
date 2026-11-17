import { useState } from "react";
import { useTranslation } from "../i18n";
import { api } from "../api";
import { useApiGet } from "../api/useApiGet";
import {
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  LoadingState,
} from "../components";
import { useGame } from "../game/gameContext";
import { CodeEditor } from "./CodeEditor";
import styles from "./Code.module.css";
import { runJavaScript } from "./runJavaScript";
import type { JavaScriptRunner } from "./runJavaScript";
import type { CodeLanguage, CodeResult, CodeSetup } from "./types";

const LANGUAGES: { id: CodeLanguage; label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "java", label: "Java" },
];

const draftKey = (problemId: string, language: CodeLanguage) =>
  `algoquest.code.${problemId}.${language}`;

function readDraft(problemId: string, language: CodeLanguage): string | null {
  try {
    return window.localStorage.getItem(draftKey(problemId, language));
  } catch {
    return null;
  }
}

function writeDraft(problemId: string, language: CodeLanguage, code: string) {
  try {
    window.localStorage.setItem(draftKey(problemId, language), code);
  } catch {
    // Storage can be unavailable; the draft is then not kept.
  }
}

function showValue(value: unknown): string {
  return JSON.stringify(value);
}

function RunResult({ result }: { result: CodeResult }) {
  const { t } = useTranslation();
  const all = result.compileError === null && result.passed === result.total;
  return (
    <div className={styles.result} role="status">
      <div className={styles.resultHead}>
        <Badge tone={all ? "success" : "warning"}>
          {result.compileError
            ? t("codeMore.noCompile")
            : `${result.passed} / ${result.total} ${t("codeMore.testsPassed")}`}
        </Badge>
        {result.xpGained > 0 && (
          <span className={styles.bonus}>
            +{result.xpGained} XP · {t("codeMore.earned")}
          </span>
        )}
        {all && result.xpGained === 0 && result.codeBonusAwarded && (
          <span className={styles.note}>{t("codeMore.bonusAlready")}</span>
        )}
      </div>
      {result.compileError && (
        <pre className={styles.detail}>{result.compileError}</pre>
      )}
      {result.failedInput && (
        <pre className={styles.detail}>
          {`${t("codeMore.firstFailed")} ${result.failedInput.map(showValue).join(", ")}\n`}
          {result.failedError
            ? `${t("codeMore.error")} ${result.failedError}`
            : `${t("codeMore.output")} ${result.failedOutput ?? "null"}`}
        </pre>
      )}
    </div>
  );
}

interface CodeRunnerProps {
  problemId: string;
  starterCode: Record<string, string>;
  setup: CodeSetup;
  runner: JavaScriptRunner;
}

function CodeRunner({
  problemId,
  starterCode,
  setup,
  runner,
}: CodeRunnerProps) {
  const { reloadLevels } = useGame();
  const { t } = useTranslation();
  const [language, setLanguage] = useState<CodeLanguage>("javascript");
  const languages = LANGUAGES.filter(
    (item) => item.id !== "java" || setup.javaAvailable,
  );
  const [codes, setCodes] = useState<Record<CodeLanguage, string>>(() => ({
    javascript:
      readDraft(problemId, "javascript") ?? starterCode.javascript ?? "",
    java: readDraft(problemId, "java") ?? starterCode.java ?? "",
  }));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [javaLeft, setJavaLeft] = useState(setup.javaRunsLeft);
  const [earned, setEarned] = useState(setup.codeBonusAwarded);
  const code = codes[language];

  const change = (next: string) => {
    setCodes((current) => ({ ...current, [language]: next }));
    writeDraft(problemId, language, next);
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      let body: Record<string, unknown> = { language, code };
      if (language === "javascript") {
        const browser = await runner(
          code,
          setup.functionName ?? "solve",
          setup.inputs,
        );
        body = { ...body, outputs: browser.outputs, errors: browser.errors };
      }
      const answer = await api.post<CodeResult>(
        `/api/v1/problems/${problemId}/code`,
        body,
      );
      setResult(answer);
      setJavaLeft(answer.javaRunsLeft);
      if (answer.codeBonusAwarded) setEarned(true);
      if (answer.xpGained > 0) reloadLevels();
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : t("common.error"));
    } finally {
      setRunning(false);
    }
  };

  const javaOut = language === "java" && javaLeft <= 0;
  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div
          className={styles.languages}
          role="group"
          aria-label={t("codeMore.lang")}
        >
          {languages.map((item) => (
            <Chip
              key={item.id}
              selected={language === item.id}
              onToggle={() => {
                setLanguage(item.id);
                setResult(null);
                setError(null);
              }}
            >
              {item.label}
            </Chip>
          ))}
        </div>
        <p className={styles.note}>
          {language === "java"
            ? `${t("codeMore.javaRuns")} ${javaLeft} of ${setup.javaDailyLimit} ${t("codeMore.runsLeft")}`
            : setup.javaAvailable
              ? t("codeMore.jsRuns")
              : `${t("codeMore.jsRuns")} ${t("codeMore.javaSoon")}`}
        </p>
      </div>
      <CodeEditor
        label={`${t("codeMore.your")} ${language === "java" ? "Java" : "JavaScript"} ${t("codeMore.code")}`}
        language={language}
        value={code}
        onChange={change}
      />
      <div className={styles.toolbar}>
        <p className={styles.note}>
          {earned
            ? t("codeMore.keepPractice")
            : `${t("codeMore.passAll")} ${setup.inputs.length} ${t("codeMore.hiddenTests")}`}
        </p>
        <Button
          onClick={() => void run()}
          disabled={running || !code.trim() || javaOut}
        >
          {running ? t("codeMore.running") : t("codeMore.run")}
        </Button>
      </div>
      {javaOut && (
        <p className={styles.note} role="status">
          {t("codeMore.javaUsed")}
        </p>
      )}
      {error && (
        <p className={styles.note} role="alert">
          {error}
        </p>
      )}
      {result && <RunResult result={result} />}
    </div>
  );
}

interface CodePanelProps {
  problemId: string;
  starterCode: Record<string, string>;
  /** Runs JavaScript; tests pass a stand-in, the page uses a Web Worker. */
  runner?: JavaScriptRunner;
}

/** "Code it for 2× XP" under a solved problem (FR-07). */
export function CodePanel({
  problemId,
  starterCode,
  runner = runJavaScript,
}: CodePanelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const setup = useApiGet<CodeSetup>(
    open ? `/api/v1/problems/${problemId}/code` : null,
  );

  return (
    <Card heading={t("codeMore.heading")}>
      {!open ? (
        <div className={styles.toolbar}>
          <p className={styles.note}>{t("codeMore.desc")}</p>
          <Button onClick={() => setOpen(true)}>{t("codeMore.write")}</Button>
        </div>
      ) : setup.state.status === "loading" ? (
        <LoadingState label={t("codeMore.loading")} />
      ) : setup.state.status === "error" ? (
        <ErrorState message={setup.state.message} onRetry={setup.reload} />
      ) : (
        <CodeRunner
          problemId={problemId}
          starterCode={starterCode}
          setup={setup.state.data}
          runner={runner}
        />
      )}
    </Card>
  );
}
