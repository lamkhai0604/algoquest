import type { CSSProperties } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/authContext";
import {
  Badge,
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
import { translate, useTranslation } from "../i18n";
import type { Locale } from "../i18n";
import styles from "./Pages.module.css";
import { FIRST_SYSTEM_DESIGN_LEVEL, levelLabel } from "../game/levelLabel";

/** The three sections of the Learning Path, in order. */
const PHASES = [
  {
    number: 1,
    titleKey: "home.core",
    goalKey: "home.coreGoal",
  },
  {
    number: 2,
    titleKey: "home.patterns",
    goalKey: "home.patternsGoal",
  },
  {
    number: 3,
    titleKey: "home.mastery",
    goalKey: "home.masteryGoal",
  },
  {
    number: 4,
    titleKey: "home.systemDesign",
    goalKey: "home.systemDesignGoal",
  },
] as const;

/** Electives after the phases, not yet open (D-070, D-087); OOP first, since patterns build on it. */
const ELECTIVES = [
  { titleKey: "home.oop", goalKey: "home.oopGoal" },
  { titleKey: "home.designPatterns", goalKey: "home.designPatternsGoal" },
] as const;

function stateLabel(
  level: Level,
  locale: Locale,
): { text: string; tone: BadgeTone } {
  if (!level.available)
    return { text: translate(locale, "common.comingSoon"), tone: "neutral" };
  if (level.bestTestScore !== null && level.state !== "LOCKED") {
    return { text: `Test ${level.bestTestScore}`, tone: "success" };
  }
  if (level.state === "OPEN")
    return { text: translate(locale, "home.open"), tone: "success" };
  if (level.state === "EASY_ONLY")
    return { text: translate(locale, "home.easyOnly"), tone: "xp" };
  return { text: translate(locale, "home.locked"), tone: "neutral" };
}

const canEnter = (level: Level) => level.available && level.state !== "LOCKED";

/**
 * The level the player should continue: the furthest algorithm level they can enter. System Design
 * levels are open to every player (D-084), so they would otherwise always be the furthest; they are
 * chosen only when no algorithm level can be entered.
 */
function currentLevel(levels: Level[]): Level | undefined {
  const open = levels.filter(canEnter);
  return (
    open.filter((level) => level.number < FIRST_SYSTEM_DESIGN_LEVEL).at(-1) ??
    open.at(-1)
  );
}

function ContinueCard({ level }: { level: Level }) {
  const { t } = useTranslation();
  const { rules } = useGame();
  const practiceAt = Math.ceil(
    (level.target * rules.practiceOpenPercent) / 100,
  );
  const percent =
    level.target > 0 ? Math.round((level.xp / level.target) * 100) : 0;
  return (
    <Card className={game.hero}>
      <div className={game.heroText}>
        <span className={game.eyebrow}>{t("common.continue")}</span>
        <h2 className={game.heroTitle}>
          {levelLabel(level.number)} · {level.title}
        </h2>
        <p className={styles.lead}>{level.summary}</p>
        <div className={styles.row}>
          <ButtonLink to={`/levels/${level.number}`}>
            {t("common.continue")}
          </ButtonLink>
          <ButtonLink to={`/levels/${level.number}/lesson`} variant="secondary">
            {t("home.readLesson")}
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
          <XpBar
            label={t("home.levelXp")}
            value={level.xp}
            max={level.target}
          />
          <p className={game.note}>
            {level.solved} of {level.problems} {t("homeMore.solved")}{" "}
            {level.practiceOpen
              ? t("homeMore.practiceOpen")
              : `${t("homeMore.practiceOpens")} ${practiceAt} XP (${rules.practiceOpenPercent}%).`}
          </p>
        </div>
      </div>
    </Card>
  );
}

function LevelTile({ level }: { level: Level }) {
  const { locale } = useTranslation();
  const label = stateLabel(level, locale);
  if (!level.available) {
    return (
      <li className={cx(game.tile, game.tileSoon)}>
        <span className={game.tileNumber}>{levelLabel(level.number)}</span>
        <span className={game.tileTitle}>{level.title}</span>
        <Badge>{label.text}</Badge>
      </li>
    );
  }
  const percent =
    level.target > 0 ? Math.min(100, (level.xp / level.target) * 100) : 0;
  const body = (
    <>
      <span className={game.tileNumber}>{levelLabel(level.number)}</span>
      <span className={game.tileTitle}>{level.title}</span>
      <span className={game.tileBar} aria-hidden="true">
        <i style={{ width: `${percent}%` }} />
      </span>
      <span className={game.tileMeta}>
        <span>
          {level.xp} / {level.target} XP
        </span>
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
        aria-label={`${levelLabel(level.number)}: ${level.title}`}
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
  const { t } = useTranslation();
  const playable = levels.filter((level) => level.available);
  const done = playable.filter(
    (level) =>
      level.bestTestScore !== null && level.bestTestScore >= rules.passScore,
  ).length;
  if (playable.length === 0) {
    // Nothing open yet: show the phase header only, no expand, no level list.
    return (
      <section className={cx(game.phase, game.phaseLocked)}>
        <div className={game.phaseSummary}>
          <span className={game.phaseText}>
            <span className={game.phaseTitle}>
              {t("common.phase")} {phase.number} · {t(phase.titleKey)}
            </span>
            <span className={game.phaseGoal}>{t(phase.goalKey)}</span>
          </span>
          <Badge>{t("common.comingSoon")}</Badge>
        </div>
      </section>
    );
  }
  return (
    <details className={game.phase} open={open}>
      <summary className={game.phaseSummary}>
        <span className={game.chevron} aria-hidden="true">
          ▶
        </span>
        <span className={game.phaseText}>
          <span className={game.phaseTitle}>
            {t("common.phase")} {phase.number} · {t(phase.titleKey)}
          </span>
          <span className={game.phaseGoal}>{t(phase.goalKey)}</span>
        </span>
        <Badge tone="xp">
          {done} of {playable.length} {t("homeMore.levelsDone")}
        </Badge>
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
  const { t } = useTranslation();
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
          open={
            firstPlayable >= 0 && i >= firstPlayable && i <= lastPlayable + 1
          }
        />
      ))}
      {ELECTIVES.map((elective) => (
        <section
          key={elective.titleKey}
          className={cx(game.phase, game.phaseLocked)}
          aria-label={t(elective.titleKey)}
        >
          <div className={game.phaseSummary}>
            <span className={game.phaseText}>
              <span className={game.phaseTitle}>
                {t("home.elective")} · {t(elective.titleKey)}
              </span>
              <span className={game.phaseGoal}>{t(elective.goalKey)}</span>
            </span>
            <Badge>{t("common.comingSoon")}</Badge>
          </div>
        </section>
      ))}
    </>
  );
}

/** The Learning Path (FR-02): the level to continue and every level by phase. */
export function HomePage() {
  const { t } = useTranslation();
  const { levels, reloadLevels } = useGame();
  const { state } = useAuth();
  const testing =
    state.status === "signed-in" &&
    state.user.permissions.includes("game.allLevels");
  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>{t("home.title")}</h1>
        <p className={styles.lead}>
          {t("home.core")} → {t("home.patterns")} → {t("home.mastery")}
        </p>
        {testing && (
          <p className={game.note} role="note">
            <Badge tone="warning">{t("home.testAccess")}</Badge>{" "}
            {t("home.testNote")}
          </p>
        )}
      </div>
      {levels.status === "loading" && (
        <LoadingState label={t("home.loading")} />
      )}
      {levels.status === "error" && (
        <ErrorState message={levels.message} onRetry={reloadLevels} />
      )}
      {levels.status === "ready" && <LearningPath levels={levels.data} />}
      <section
        className={cx(game.phase, game.phaseLocked)}
        aria-label={t("home.battle")}
      >
        <div className={game.phaseSummary}>
          <span className={game.phaseText}>
            <span className={game.phaseTitle}>{t("home.battle")}</span>
            <span className={game.phaseGoal}>{t("home.battleGoal")}</span>
          </span>
          <Badge>{t("common.comingSoon")}</Badge>
        </div>
      </section>
    </div>
  );
}
