import { useTranslation } from "../i18n";
import { Link, useParams } from "react-router";
import { useApiGet } from "../api/useApiGet";
import {
  BackButton,
  Badge,
  ButtonLink,
  Card,
  ErrorState,
  LoadingState,
  XpBar,
} from "../components";
import { useGame } from "../game/gameContext";
import type { Level, ProblemItem } from "../game/types";
import { TestStartCard } from "../leveltest/TestStartCard";
import { PatternChallenges } from "../pattern/PatternChallenges";
import game from "./Game.module.css";
import { LevelNotes, useCanKeepNotes } from "../notes/LevelNotes";
import styles from "./Pages.module.css";

function ProblemStatus({ problem }: { problem: ProblemItem }) {
  const { t } = useTranslation();
  if (problem.status === "comingSoon") {
    return <Badge tone="warning">{t("level.comingSoon")}</Badge>;
  }
  if (problem.locked) return <Badge>{t("level.locked")}</Badge>;
  if (problem.solved) {
    const done = problem.practiceDone ? ` · ${t("level.done")}` : "";
    return (
      <Badge tone="success">{`${t("levelExtra.solved")} · +${problem.xp} XP${done}`}</Badge>
    );
  }
  if (problem.tried)
    return <Badge tone="warning">{t("level.notSolved")}</Badge>;
  if (problem.paused) return null;
  return <Badge>{t("level.notTried")}</Badge>;
}

function ProblemRow({ problem }: { problem: ProblemItem }) {
  const { t } = useTranslation();
  const body = (
    <>
      <span className={game.rowText}>
        <span className={game.rowTitle}>{problem.title}</span>
      </span>
      <span className={game.rowMeta}>
        <Badge tone="primary">{problem.difficulty}</Badge>
        {problem.paused && <Badge tone="xp">⏸ {t("levelExtra.paused")}</Badge>}
        <ProblemStatus problem={problem} />
      </span>
    </>
  );
  if (problem.status === "comingSoon" || problem.locked) {
    return <li className={game.levelRow}>{body}</li>;
  }
  return (
    <li>
      <Link to={`/problems/${problem.id}`} className={game.levelRow}>
        {body}
      </Link>
    </li>
  );
}

function PracticeRound({
  level,
  problems,
}: {
  level: Level;
  problems: ProblemItem[];
}) {
  const { rules } = useGame();
  const { t } = useTranslation();
  const solved = problems.filter((problem) => problem.solved);
  if (!level.practiceOpen) {
    const at = Math.ceil((level.target * rules.practiceOpenPercent) / 100);
    return (
      <p className={game.note}>
        {t("levelExtra.practicePrefix")} {at} XP ({rules.practiceOpenPercent}%{" "}
        {t("levelExtra.practiceSuffix")}
      </p>
    );
  }
  return (
    <Card heading={t("levelExtra.practiceRound")}>
      <p className={game.note}>
        {t("levelExtra.practiceDesc")} {rules.practiceDoneXp}{" "}
        {t("levelExtra.practiceDescEnd")}
      </p>
      <ul className={game.levelList}>
        {solved.map((problem) =>
          problem.practiceDone ? (
            <li key={problem.id} className={game.levelRow}>
              <span className={game.rowText}>{problem.title}</span>
              <Badge tone="success">{t("level.done")}</Badge>
            </li>
          ) : (
            <li key={problem.id}>
              <Link
                to={`/problems/${problem.id}?mode=practice`}
                className={game.levelRow}
              >
                <span className={game.rowText}>{problem.title}</span>
                <Badge tone="xp">{t("level.practice")}</Badge>
              </Link>
            </li>
          ),
        )}
      </ul>
    </Card>
  );
}

/** One level: XP bar, lesson, practice round, and problems (FR-04, FR-09). */
export function LevelPage() {
  const { t, locale } = useTranslation();
  const number = Number(useParams().number);
  const { levels, rules } = useGame();
  const canKeepNotes = useCanKeepNotes();
  const problems = useApiGet<ProblemItem[]>(
    `/api/v1/levels/${number}/problems?lang=${locale}`,
  );
  const level =
    levels.status === "ready"
      ? levels.data.find((l) => l.number === number)
      : undefined;
  const title = level ? `Level ${level.number} · ${level.title}` : "Level";

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <BackButton to="/" label={t("profile.back")} />
        <nav className={game.crumbs} aria-label={t("level.breadcrumb")}>
          <Link to="/">{t("nav.map")}</Link> / <span>{title}</span>
        </nav>
      </div>
      <h1 className={styles.title}>{title}</h1>
      {level && (
        <Card>
          <div className={game.levelIntro}>
            <XpBar
              label={t("home.levelXp")}
              value={level.xp}
              max={level.target}
            />
            <p className={game.note}>{level.summary}</p>
            <div className={styles.row}>
              <ButtonLink to={`/levels/${number}/lesson`} variant="secondary">
                {t("home.readLesson")}
              </ButtonLink>
            </div>
          </div>
        </Card>
      )}
      {level && canKeepNotes && <LevelNotes level={number} />}
      {level && problems.state.status === "ready" && (
        <PracticeRound level={level} problems={problems.state.data} />
      )}
      {level && <TestStartCard level={level} />}
      <section className={game.path}>
        <h2 className={game.sectionTitle}>{t("level.problems")}</h2>
        <p className={game.note}>
          {t("levelExtra.unlockPrefix")} {rules.passScore}{" "}
          {t("levelExtra.unlockSuffix")}
        </p>
        {problems.state.status === "loading" && (
          <LoadingState label={t("level.loading")} />
        )}
        {problems.state.status === "error" && (
          <ErrorState
            message={problems.state.message}
            onRetry={problems.reload}
          />
        )}
        {problems.state.status === "ready" && (
          <ul className={game.levelList}>
            {problems.state.data.map((problem) => (
              <ProblemRow key={problem.id} problem={problem} />
            ))}
          </ul>
        )}
      </section>
      {level?.available && <PatternChallenges level={number} />}
    </div>
  );
}
