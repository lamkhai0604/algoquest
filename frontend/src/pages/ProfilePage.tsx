import { Badge, Card, ErrorState, LoadingState, XpBar } from "../components";
import { useGame } from "../game/gameContext";
import type { Level, Profile } from "../game/types";
import game from "./Game.module.css";
import styles from "./Pages.module.css";

function stateText(level: Level): string {
  if (!level.available) return "Coming later";
  if (level.state === "OPEN") return "Open";
  if (level.state === "EASY_ONLY") return "Easy only";
  return "Locked";
}

function Stats({ profile }: { profile: Profile }) {
  const items = [
    { label: "Total XP", value: profile.totalXp },
    { label: "Problems solved", value: profile.solvedProblems },
    { label: "Day streak", value: profile.currentStreak },
    { label: "Best streak", value: profile.bestStreak },
  ];
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <Card key={item.label} className={game.stat}>
          <span className={game.statValue}>{item.value}</span>
          <span className={game.note}>{item.label}</span>
        </Card>
      ))}
    </div>
  );
}

/** Profile (FR-12): totals, streak, and progress per level. */
export function ProfilePage() {
  const { profile, reloadLevels } = useGame();
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {profile.status === "ready" ? profile.data.displayName : "Profile"}
      </h1>
      {profile.status === "loading" && <LoadingState label="Loading profile…" />}
      {profile.status === "error" && (
        <ErrorState message={profile.message} onRetry={reloadLevels} />
      )}
      {profile.status === "ready" && (
        <>
          <Stats profile={profile.data} />
          <Card heading="Progress by level">
            <ul className={game.levelList}>
              {profile.data.levels
                .filter((level) => level.available)
                .map((level) => (
                  <li key={level.number} className={game.profileRow}>
                    <span className={game.rowTitle}>
                      {level.number}. {level.title}
                    </span>
                    <Badge>{stateText(level)}</Badge>
                    <span className={game.note}>
                      {level.bestTestScore === null
                        ? "No test yet"
                        : `Best test: ${level.bestTestScore} / 100`}
                    </span>
                    <XpBar label="Level XP" value={level.xp} max={level.target} />
                  </li>
                ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
