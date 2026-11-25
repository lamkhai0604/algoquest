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
import { translate, useTranslation } from "../i18n";
import type { Locale } from "../i18n";
import styles from "./Pages.module.css";
import { levelLabel } from "../game/levelLabel";

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
  locale: Locale,
): { text: string; tone: BadgeTone } {
  if (passed(level, passScore))
    return { text: translate(locale, "profileMore.passed"), tone: "success" };
  if (level.state === "OPEN")
    return { text: translate(locale, "home.open"), tone: "primary" };
  if (level.state === "EASY_ONLY")
    return { text: translate(locale, "home.easyOnly"), tone: "warning" };
  return { text: translate(locale, "home.locked"), tone: "neutral" };
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

function streakText(profile: Profile, locale: Locale): string {
  if (profile.currentStreak === 0) {
    return translate(locale, "profileMore.noStreak");
  }
  const days = profile.currentStreak === 1 ? "day" : "days";
  const unit = locale === "vi" ? "ngày" : days;
  return `${profile.currentStreak} ${unit} ${translate(locale, "profileMore.daysInRow")}`;
}

function Hero({ profile }: { profile: Profile }) {
  const { t, locale } = useTranslation();
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
            {t("profileMore.nowOn")} {levelLabel(current.number)} ·{" "}
            {current.title}
          </p>
        )}
        <p className={game.note}>{streakText(profile, locale)}</p>
        {current && (
          <div className={styles.row}>
            <ButtonLink to={`/levels/${current.number}`}>
              {t("common.continue")}
            </ButtonLink>
          </div>
        )}
      </div>
      <div className={game.profileTotal}>
        <span className={game.profileTotalValue}>{profile.totalXp}</span>
        <span className={game.note}>{t("profileExtra.totalXp")}</span>
      </div>
    </Card>
  );
}

function Stats({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const { rules } = useGame();
  const levelsPassed = profile.levels.filter((level) =>
    passed(level, rules.passScore),
  ).length;
  const items = [
    { label: t("profileMore.problemsSolved"), value: profile.solvedProblems },
    { label: t("profileMore.levelsPassed"), value: levelsPassed },
    { label: t("profileMore.dayStreak"), value: profile.currentStreak },
    { label: t("profileMore.bestStreak"), value: profile.bestStreak },
  ];
  return (
    <ul className={game.statRow} aria-label={t("profileExtra.totals")}>
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
  const { t, locale } = useTranslation();
  const { rules } = useGame();
  const badge = stateBadge(level, rules.passScore, locale);
  return (
    <li>
      <Link to={`/levels/${level.number}`} className={game.profileLevel}>
        <span className={game.tileNumber}>{levelLabel(level.number)}</span>
        <span className={game.rowTitle}>{level.title}</span>
        <Badge tone={badge.tone}>{badge.text}</Badge>
        <span className={game.profileLevelBar}>
          <XpBar
            label={t("home.levelXp")}
            value={level.xp}
            max={level.target}
          />
        </span>
        <span className={game.note}>
          {level.solved} of {level.problems} problems ·{" "}
          {level.bestTestScore === null
            ? t("profileMore.noTest")
            : `${t("profileMore.bestTest")} ${level.bestTestScore} / 100`}
        </span>
      </Link>
    </li>
  );
}

function Progress({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const { rules } = useGame();
  const unlocked = profile.levels.filter(
    (level) => level.available && level.state !== "LOCKED",
  );
  const phases = [...new Set(unlocked.map((level) => level.phase))];
  return (
    <Card heading={t("profileMore.progressBy")}>
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
                {done} of {playable.length} {t("profileMore.levelPassed")}
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
  const { t } = useTranslation();
  const { profile, reloadLevels } = useGame();
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <BackButton to="/" label={t("profile.back")} />
        {profile.status !== "ready" && (
          <h1 className={styles.title}>{t("nav.profile")}</h1>
        )}
      </div>
      {profile.status === "loading" && (
        <LoadingState label={t("profile.loading")} />
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
