import { Link, useParams } from "react-router";
import { useApiGet } from "../api/useApiGet";
import {
  Badge,
  ButtonLink,
  Card,
  ErrorState,
  LoadingState,
  XpBar,
} from "../components";
import { useGame } from "../game/gameContext";
import type { ProblemItem } from "../game/types";
import game from "./Game.module.css";
import styles from "./Pages.module.css";

function ProblemStatus({ problem }: { problem: ProblemItem }) {
  if (problem.status === "comingSoon") {
    return <Badge tone="warning">Coming in a later version</Badge>;
  }
  if (problem.locked) return <Badge>Locked</Badge>;
  if (problem.solved) {
    return <Badge tone="success">Solved · +{problem.xp} XP</Badge>;
  }
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

/** One level: its XP bar, lesson, and practice problems (FR-04.1). */
export function LevelPage() {
  const number = Number(useParams().number);
  const { levels } = useGame();
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
      <nav className={game.crumbs} aria-label="Breadcrumb">
        <Link to="/">Level map</Link> / <span>{title}</span>
      </nav>
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
      <section className={game.path}>
        <h2 className={game.sectionTitle}>Problems</h2>
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
