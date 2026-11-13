import { Link } from "react-router";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ErrorState,
  LoadingState,
  XpBar,
} from "../components";
import type { BadgeTone } from "../components";
import { useGame } from "../game/gameContext";
import type { Level } from "../game/types";
import game from "./Game.module.css";
import styles from "./Pages.module.css";

function stateLabel(level: Level): { text: string; tone: BadgeTone } {
  if (!level.available) return { text: "Coming soon", tone: "neutral" };
  if (level.state === "OPEN") return { text: "Open", tone: "success" };
  if (level.state === "EASY_ONLY") return { text: "Easy only", tone: "xp" };
  return { text: "Locked", tone: "neutral" };
}

const canEnter = (level: Level) => level.available && level.state !== "LOCKED";

/** The level the player should continue: the furthest one they can enter. */
function currentLevel(levels: Level[]): Level | undefined {
  return levels.filter(canEnter).at(-1);
}

function CurrentLevelCard({ level }: { level: Level }) {
  const { rules } = useGame();
  const practiceAt = Math.ceil(
    (level.target * rules.practiceOpenPercent) / 100,
  );
  return (
    <Card className={game.hero}>
      <span className={game.eyebrow}>Continue</span>
      <h2 className={game.heroTitle}>
        Level {level.number} · {level.title}
      </h2>
      <p className={styles.lead}>{level.summary}</p>
      <XpBar label="Level XP" value={level.xp} max={level.target} />
      <p className={game.note}>
        {level.practiceOpen
          ? "The practice round is open."
          : `The practice round opens at ${practiceAt} XP (${rules.practiceOpenPercent}%).`}{" "}
        {level.solved} of {level.problems} problems solved.
      </p>
      <div className={styles.row}>
        <ButtonLink to={`/levels/${level.number}`}>Continue</ButtonLink>
        <ButtonLink to={`/levels/${level.number}/lesson`} variant="secondary">
          Read lesson
        </ButtonLink>
      </div>
    </Card>
  );
}

function LevelRow({ level }: { level: Level }) {
  const label = stateLabel(level);
  const body = (
    <>
      <span className={game.number}>{level.number}</span>
      <span className={game.rowText}>
        <span className={game.rowTitle}>{level.title}</span>
        <span className={game.rowSummary}>{level.summary}</span>
      </span>
      <span className={game.rowMeta}>
        <Badge tone={label.tone}>{label.text}</Badge>
        <span className={game.rowXp}>
          {level.xp} / {level.target} XP
        </span>
      </span>
    </>
  );
  if (!canEnter(level)) {
    return <li className={game.levelRow}>{body}</li>;
  }
  return (
    <li>
      <Link
        to={`/levels/${level.number}`}
        className={game.levelRow}
        aria-label={`Level ${level.number}: ${level.title}`}
      >
        {body}
      </Link>
    </li>
  );
}

function LevelMap({ levels }: { levels: Level[] }) {
  const current = currentLevel(levels);
  return (
    <>
      {current && <CurrentLevelCard level={current} />}
      <section className={game.path}>
        <h2 className={game.sectionTitle}>Your path</h2>
        <ol className={game.levelList}>
          {levels.map((level) => (
            <LevelRow key={level.number} level={level} />
          ))}
        </ol>
      </section>
    </>
  );
}

/** Level map (FR-02): the current level and the whole path. */
export function HomePage() {
  const { levels, reloadLevels } = useGame();
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your quest</h1>
      {levels.status === "loading" && <LoadingState label="Loading levels…" />}
      {levels.status === "error" && (
        <ErrorState message={levels.message} onRetry={reloadLevels} />
      )}
      {levels.status === "ready" && <LevelMap levels={levels.data} />}
      <Card heading="Battle mode">
        <p className={game.note}>
          Race another player on the same problem: the better explanation wins
          the round. <Badge tone="warning">Coming soon</Badge>
        </p>
        <div className={styles.row}>
          <Button variant="secondary" disabled>
            Find an opponent
          </Button>
        </div>
      </Card>
    </div>
  );
}
