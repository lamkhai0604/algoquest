import { Link } from "react-router";
import { useApiGet } from "../api/useApiGet";
import { Badge } from "../components";
import game from "../pages/Game.module.css";
import { useTranslation } from "../i18n";
import { LABEL_TONE } from "./types";
import type { ChallengeSummary } from "./types";

/**
 * The level page's Pattern challenges section (D-057): shown only when the level has challenges.
 * A failed load hides the section; it is an optional pilot and must not block the level page.
 */
export function PatternChallenges({ level }: { level: number }) {
  const { t } = useTranslation();
  const list = useApiGet<ChallengeSummary[]>(
    `/api/v1/levels/${level}/patterns`,
  );
  if (list.state.status !== "ready" || list.state.data.length === 0)
    return null;
  return (
    <section className={game.path} aria-labelledby="pattern-heading">
      <h2 className={game.sectionTitle} id="pattern-heading">
        {t("pattern.challenges")} <Badge tone="primary">{t("pattern.pilot")}</Badge>
      </h2>
      <p className={game.note}>
        {t("pattern.intro")}
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
                    {t(`pattern.${challenge.bestLabel}`)}
                  </Badge>
                ) : (
                  <Badge>{t("pattern.notTried")}</Badge>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
