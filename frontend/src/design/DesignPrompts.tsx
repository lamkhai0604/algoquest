import { Link } from "react-router";
import { useApiGet } from "../api/useApiGet";
import { Badge } from "../components";
import game from "../pages/Game.module.css";
import { useTranslation } from "../i18n";
import type { PromptSummary } from "./types";

/**
 * The level page's Design prompts section (D-085): shown only when the level has prompts. A failed
 * load hides the section; it is an optional pilot and must not block the level page.
 */
export function DesignPrompts({ level }: { level: number }) {
  const { t } = useTranslation();
  const list = useApiGet<PromptSummary[]>(`/api/v1/levels/${level}/designs`);
  if (list.state.status !== "ready" || list.state.data.length === 0)
    return null;
  return (
    <section className={game.path} aria-labelledby="design-heading">
      <h2 className={game.sectionTitle} id="design-heading">
        {t("design.prompts")} <Badge tone="primary">{t("design.pilot")}</Badge>
      </h2>
      <p className={game.note}>{t("design.intro")}</p>
      <ul className={game.levelList}>
        {list.state.data.map((prompt) => (
          <li key={prompt.id}>
            <Link to={`/designs/${prompt.id}`} className={game.levelRow}>
              <span className={game.rowText}>
                <span className={game.rowTitle}>{prompt.title}</span>
              </span>
              <span className={game.rowMeta}>
                {prompt.bestScore === null ? (
                  <Badge>{t("design.notTried")}</Badge>
                ) : (
                  <Badge tone={prompt.bestScore >= 70 ? "success" : "xp"}>
                    {t("design.best")} {prompt.bestScore}/100
                  </Badge>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
