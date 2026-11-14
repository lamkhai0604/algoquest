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
import game from "./Game.module.css";
import styles from "./Pages.module.css";

function ProblemStatus({ problem }: { problem: ProblemItem }) {
  if (problem.status === "comingSoon") {
    return <Badge tone="warning">Coming soon</Badge>;
  }
  if (problem.locked) return <Badge>Locked</Badge>;
  if (problem.solved) {
    const done = problem.practiceDone ? " · Done" : "";
    return <Badge tone="success">{`Solved · +${problem.xp} XP${done}`}</Badge>;
  }
  if (problem.tried) return <Badge tone="warning">Not solved yet</Badge>;
  if (problem.paused) return null;
  return <Badge>Not tried</Badge>;
}

function ProblemRow({ problem }: { problem: ProblemItem }) {
  const body = (
    <>
      <span className={game.rowText}>
        <span className={game.rowTitle}>{problem.title}</span>
      </span>
      <span className={game.rowMeta}>
        <Badge tone="primary">{problem.difficulty}</Badge>
        {problem.paused && <Badge tone="xp">⏸ Paused</Badge>}
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
  const solved = problems.filter((problem) => problem.solved);
  if (!level.practiceOpen) {
    const at = Math.ceil((level.target * rules.practiceOpenPercent) / 100);
    return (
      <p className={game.note}>
        The practice round opens at {at} XP ({rules.practiceOpenPercent}% of the
        bar).
      </p>
    );
  }
  return (
    <Card heading="Practice round">
      <p className={game.note}>
        Explain a solved problem again without hints. Each one marked Done adds{" "}
        {rules.practiceDoneXp} XP until the bar is full.
      </p>
      <ul className={game.levelList}>
        {solved.map((problem) =>
          problem.practiceDone ? (
            <li key={problem.id} className={game.levelRow}>
              <span className={game.rowText}>{problem.title}</span>
              <Badge tone="success">Done</Badge>
            </li>
          ) : (
            <li key={problem.id}>
              <Link
                to={`/problems/${problem.id}?mode=practice`}
                className={game.levelRow}
              >
                <span className={game.rowText}>{problem.title}</span>
                <Badge tone="xp">Practice</Badge>
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
  const number = Number(useParams().number);
  const { levels, rules } = useGame();
  const problems = useApiGet<ProblemItem[]>(
    `/api/v1/levels/${number}/problems`,
  );
  const level =
    levels.status === "ready"
      ? levels.data.find((l) => l.number === number)
      : undefined;
  const title = level ? `Level ${level.number} · ${level.title}` : "Level";

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <BackButton to="/" label="Back to the Learning Path" />
        <nav className={game.crumbs} aria-label="Breadcrumb">
          <Link to="/">Learning Path</Link> / <span>{title}</span>
        </nav>
      </div>
      <h1 className={styles.title}>{title}</h1>
      {level && (
        <Card>
          <XpBar label="Level XP" value={level.xp} max={level.target} />
          <p className={game.note}>{level.summary}</p>
          <div className={styles.row}>
            <ButtonLink to={`/levels/${number}/lesson`} variant="secondary">
              Read lesson
            </ButtonLink>
          </div>
        </Card>
      )}
      {level && problems.state.status === "ready" && (
        <PracticeRound level={level} problems={problems.state.data} />
      )}
      {level && <TestStartCard level={level} />}
      <section className={game.path}>
        <h2 className={game.sectionTitle}>Problems</h2>
        <p className={game.note}>
          Problems open in order: solve one (score {rules.passScore} or more) to
          open the next.
        </p>
        {problems.state.status === "loading" && (
          <LoadingState label="Loading problems…" />
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
    </div>
  );
}
