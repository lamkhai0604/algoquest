import { Link } from "react-router";
import {
  BackButton,
  Badge,
  ButtonLink,
  Card,
  ErrorState,
  LoadingState,
  XpBar,
} from "../components";
import type { BadgeTone } from "../components";
import { useGame } from "../game/gameContext";
import type { Level, Profile } from "../game/types";
import game from "./Game.module.css";
import styles from "./Pages.module.css";

/** Phase names, as on the Learning Path (D-048). */
const PHASE_TITLES: Record<number, string> = {
  1: "Core Foundations",
  2: "Problem-Solving Patterns",
  3: "Interview Mastery",
};

function passed(level: Level, passScore: number): boolean {
  return level.bestTestScore !== null && level.bestTestScore >= passScore;
}

function stateBadge(
  level: Level,
  passScore: number,
): { text: string; tone: BadgeTone } {
  if (passed(level, passScore)) return { text: "Passed", tone: "success" };
  if (level.state === "OPEN") return { text: "Open", tone: "primary" };
  if (level.state === "EASY_ONLY")
    return { text: "Easy only", tone: "warning" };
  return { text: "Locked", tone: "neutral" };
}

/** The level to continue: the first unlocked level not yet passed, else the last unlocked one. */
function currentLevel(levels: Level[], passScore: number): Level | undefined {
  const unlocked = levels.filter(
    (level) => level.available && level.state !== "LOCKED",
  );
  return (
    unlocked.find((level) => !passed(level, passScore)) ??
    unlocked[unlocked.length - 1]
  );
}

function streakText(profile: Profile): string {
  if (profile.currentStreak === 0) {
    return "Solve a problem today to start a streak.";
  }
  const days = profile.currentStreak === 1 ? "day" : "days";
  return `${profile.currentStreak} ${days} in a row. Solve one problem each day to keep it going.`;
}

function Hero({ profile }: { profile: Profile }) {
  const { rules } = useGame();
  const current = currentLevel(profile.levels, rules.passScore);
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || "?";
  return (
    <Card className={game.profileHero}>
      <span className={game.avatar} aria-hidden="true">
        {initial}
      </span>
      <div className={game.profileIdentity}>
        <h1 className={styles.title}>{profile.displayName}</h1>
        {current && (
          <p className={game.note}>
            Now on Level {current.number} · {current.title}
          </p>
        )}
        <p className={game.note}>{streakText(profile)}</p>
        {current && (
          <div className={styles.row}>
            <ButtonLink to={`/levels/${current.number}`}>Continue</ButtonLink>
          </div>
        )}
      </div>
      <div className={game.profileTotal}>
        <span className={game.profileTotalValue}>{profile.totalXp}</span>
        <span className={game.note}>Total XP</span>
      </div>
    </Card>
  );
}

function Stats({ profile }: { profile: Profile }) {
  const { rules } = useGame();
  const levelsPassed = profile.levels.filter((level) =>
    passed(level, rules.passScore),
  ).length;
  const items = [
    { label: "Problems solved", value: profile.solvedProblems },
    { label: "Levels passed", value: levelsPassed },
    { label: "Day streak", value: profile.currentStreak },
    { label: "Best streak", value: profile.bestStreak },
  ];
  return (
    <ul className={game.statRow} aria-label="Totals">
      {items.map((item) => (
        <li key={item.label} className={game.statTile}>
          <span className={game.statValue}>{item.value}</span>
          <span className={game.note}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function LevelRow({ level }: { level: Level }) {
  const { rules } = useGame();
  const badge = stateBadge(level, rules.passScore);
  return (
    <li>
      <Link to={`/levels/${level.number}`} className={game.profileLevel}>
        <span className={game.tileNumber}>Level {level.number}</span>
        <span className={game.rowTitle}>{level.title}</span>
        <Badge tone={badge.tone}>{badge.text}</Badge>
        <span className={game.profileLevelBar}>
          <XpBar label="Level XP" value={level.xp} max={level.target} />
        </span>
        <span className={game.note}>
          {level.solved} of {level.problems} problems ·{" "}
          {level.bestTestScore === null
            ? "No test yet"
            : `Best test: ${level.bestTestScore} / 100`}
        </span>
      </Link>
    </li>
  );
}

function Progress({ profile }: { profile: Profile }) {
  const { rules } = useGame();
  const unlocked = profile.levels.filter(
    (level) => level.available && level.state !== "LOCKED",
  );
  const phases = [...new Set(unlocked.map((level) => level.phase))];
  return (
    <Card heading="Progress by level">
      {phases.map((phase) => {
        const playable = profile.levels.filter(
          (level) => level.phase === phase && level.available,
        );
        const done = playable.filter((level) =>
          passed(level, rules.passScore),
        ).length;
        return (
          <div key={phase} className={game.profilePhase}>
            <div className={game.profilePhaseHead}>
              <span className={game.phaseTitle}>
                Phase {phase} · {PHASE_TITLES[phase] ?? ""}
              </span>
              <Badge tone="xp">
                {done} of {playable.length} levels passed
              </Badge>
            </div>
            <ul className={game.levelList}>
              {unlocked
                .filter((level) => level.phase === phase)
                .map((level) => (
                  <LevelRow key={level.number} level={level} />
                ))}
            </ul>
          </div>
        );
      })}
    </Card>
  );
}

/** Profile (FR-12): who you are, where to continue, totals, streak, and progress per level. */
export function ProfilePage() {
  const { profile, reloadLevels } = useGame();
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <BackButton to="/" label="Back to the Learning Path" />
        {profile.status !== "ready" && (
          <h1 className={styles.title}>Profile</h1>
        )}
      </div>
      {profile.status === "loading" && (
        <LoadingState label="Loading profile…" />
      )}
      {profile.status === "error" && (
        <ErrorState message={profile.message} onRetry={reloadLevels} />
      )}
      {profile.status === "ready" && (
        <>
          <Hero profile={profile.data} />
          <Stats profile={profile.data} />
          <Progress profile={profile.data} />
        </>
      )}
    </div>
  );
}
