import type { CSSProperties } from "react";
import { Link } from "react-router";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  cx,
  ErrorState,
  LoadingState,
  XpBar,
} from "../components";
import type { BadgeTone } from "../components";
import { useGame } from "../game/gameContext";
import type { Level } from "../game/types";
import game from "./Game.module.css";
import styles from "./Pages.module.css";

/** The three sections of the Learning Path, in order. */
export const PHASES = [
  {
    number: 1,
    title: "Core Foundations",
    goal: "Build the base before harder problems",
  },
  {
    number: 2,
    title: "Problem-Solving Patterns",
    goal: "Recognize when and why to use each approach",
  },
  {
    number: 3,
    title: "Interview Mastery",
    goal: "Solve unfamiliar problems without being told the pattern",
  },
] as const;

function stateLabel(level: Level): { text: string; tone: BadgeTone } {
  if (!level.available) return { text: "Coming soon", tone: "neutral" };
  if (level.bestTestScore !== null && level.state !== "LOCKED") {
    return { text: `Test ${level.bestTestScore}`, tone: "success" };
  }
  if (level.state === "OPEN") return { text: "Open", tone: "success" };
  if (level.state === "EASY_ONLY") return { text: "Easy only", tone: "xp" };
  return { text: "Locked", tone: "neutral" };
}

const canEnter = (level: Level) => level.available && level.state !== "LOCKED";

/** The level the player should continue: the furthest one they can enter. */
function currentLevel(levels: Level[]): Level | undefined {
  return levels.filter(canEnter).at(-1);
}

function ContinueCard({ level }: { level: Level }) {
  const { rules } = useGame();
  const practiceAt = Math.ceil(
    (level.target * rules.practiceOpenPercent) / 100,
  );
  const percent =
    level.target > 0 ? Math.round((level.xp / level.target) * 100) : 0;
  return (
    <Card className={game.hero}>
      <div className={game.heroText}>
        <span className={game.eyebrow}>Continue</span>
        <h2 className={game.heroTitle}>
          Level {level.number} · {level.title}
        </h2>
        <p className={styles.lead}>{level.summary}</p>
        <div className={styles.row}>
          <ButtonLink to={`/levels/${level.number}`}>Continue</ButtonLink>
          <ButtonLink
            to={`/levels/${level.number}/lesson`}
            variant="secondary"
          >
            Read lesson
          </ButtonLink>
        </div>
      </div>
      <div className={game.heroStats}>
        <div
          className={game.ring}
          style={{ "--ring": `${percent}%` } as CSSProperties}
          aria-hidden="true"
        >
          <span>{percent}%</span>
        </div>
        <div className={game.heroNumbers}>
          <XpBar label="Level XP" value={level.xp} max={level.target} />
          <p className={game.note}>
            {level.solved} of {level.problems} problems solved.{" "}
            {level.practiceOpen
              ? "The practice round is open."
              : `The practice round opens at ${practiceAt} XP (${rules.practiceOpenPercent}%).`}
          </p>
        </div>
      </div>
    </Card>
  );
}

function LevelTile({ level }: { level: Level }) {
  const label = stateLabel(level);
  const percent =
    level.target > 0 ? Math.min(100, (level.xp / level.target) * 100) : 0;
  const body = (
    <>
      <span className={game.tileNumber}>
        {level.available ? `Level ${level.number}` : "Next"}
      </span>
      <span className={game.tileTitle}>{level.title}</span>
      <span className={game.tileBar} aria-hidden="true">
        <i style={{ width: `${percent}%` }} />
      </span>
      <span className={game.tileMeta}>
        <span>{level.available ? `${level.xp} / ${level.target} XP` : ""}</span>
        <Badge tone={label.tone}>{label.text}</Badge>
      </span>
    </>
  );
  if (!canEnter(level)) {
    return <li className={cx(game.tile, game.tileLocked)}>{body}</li>;
  }
  return (
    <li>
      <Link
        to={`/levels/${level.number}`}
        className={game.tile}
        aria-label={`Level ${level.number}: ${level.title}`}
      >
        {body}
      </Link>
    </li>
  );
}

function PhaseSection({
  phase,
  levels,
  open,
}: {
  phase: (typeof PHASES)[number];
  levels: Level[];
  open: boolean;
}) {
  const { rules } = useGame();
  const playable = levels.filter((level) => level.available);
  const done = playable.filter(
    (level) =>
      level.bestTestScore !== null && level.bestTestScore >= rules.passScore,
  ).length;
  return (
    <details className={game.phase} open={open}>
      <summary className={game.phaseSummary}>
        <span className={game.chevron} aria-hidden="true">
          ▶
        </span>
        <span className={game.phaseText}>
          <span className={game.phaseTitle}>
            Phase {phase.number} · {phase.title}
          </span>
          <span className={game.phaseGoal}>{phase.goal}</span>
        </span>
        {playable.length > 0 ? (
          <Badge tone="xp">
            {done} of {playable.length} levels done
          </Badge>
        ) : (
          <Badge>Coming soon</Badge>
        )}
      </summary>
      <ol className={game.tiles} aria-label={`Phase ${phase.number} levels`}>
        {levels.map((level) => (
          <LevelTile key={level.number} level={level} />
        ))}
      </ol>
    </details>
  );
}

function LearningPath({ levels }: { levels: Level[] }) {
  const current = currentLevel(levels);
  const byPhase = PHASES.map((phase) =>
    levels.filter((level) => level.phase === phase.number),
  );
  // A phase starts open when it has playable levels, and so does the next one,
  // as a preview of what comes after.
  const playable = byPhase.map((list) => list.some((level) => level.available));
  const firstPlayable = playable.indexOf(true);
  const lastPlayable = playable.lastIndexOf(true);
  return (
    <>
      {current && <ContinueCard level={current} />}
      {PHASES.map((phase, i) => (
        <PhaseSection
          key={phase.number}
          phase={phase}
          levels={byPhase[i] ?? []}
          open={firstPlayable >= 0 && i >= firstPlayable && i <= lastPlayable + 1}
        />
      ))}
    </>
  );
}

/** The Learning Path (FR-02): the level to continue and every level by phase. */
export function HomePage() {
  const { levels, reloadLevels } = useGame();
  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Learning Path</h1>
        <p className={styles.lead}>
          Core Foundations → Problem-Solving Patterns → Interview Mastery
        </p>
      </div>
      {levels.status === "loading" && <LoadingState label="Loading levels…" />}
      {levels.status === "error" && (
        <ErrorState message={levels.message} onRetry={reloadLevels} />
      )}
      {levels.status === "ready" && <LearningPath levels={levels.data} />}
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
