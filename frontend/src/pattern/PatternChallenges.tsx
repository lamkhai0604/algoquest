import { Link } from "react-router";
import { useApiGet } from "../api/useApiGet";
import { Badge } from "../components";
import type { BadgeTone } from "../components";
import game from "../pages/Game.module.css";
import { LABEL_TEXT } from "./types";
import type { ApproachLabel, ChallengeSummary } from "./types";

export const LABEL_TONE: Record<ApproachLabel, BadgeTone> = {
  best: "success",
  valid: "xp",
  unsuitable: "warning",
};

/**
 * The level page's Pattern challenges section (D-057): shown only when the level has challenges.
 * A failed load hides the section; it is an optional pilot and must not block the level page.
 */
export function PatternChallenges({ level }: { level: number }) {
  const list = useApiGet<ChallengeSummary[]>(`/api/v1/levels/${level}/patterns`);
  if (list.state.status !== "ready" || list.state.data.length === 0) return null;
  return (
    <section className={game.path} aria-labelledby="pattern-heading">
      <h2 className={game.sectionTitle} id="pattern-heading">
        Pattern challenges <Badge tone="primary">Pilot · no XP</Badge>
      </h2>
      <p className={game.note}>
        Each problem hides its pattern. Pick the approach you would use and say
        why. Any correct approach counts.
      </p>
      <ul className={game.levelList}>
        {list.state.data.map((challenge) => (
          <li key={challenge.id}>
            <Link to={`/patterns/${challenge.id}`} className={game.levelRow}>
              <span className={game.rowText}>
                <span className={game.rowTitle}>{challenge.title}</span>
              </span>
              <span className={game.rowMeta}>
                {challenge.bestLabel ? (
                  <Badge tone={LABEL_TONE[challenge.bestLabel]}>
                    {LABEL_TEXT[challenge.bestLabel]}
                  </Badge>
                ) : (
                  <Badge>Not tried</Badge>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
