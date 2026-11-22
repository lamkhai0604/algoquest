import { Link } from "react-router";
import { Card } from "../components";
import { useTranslation } from "../i18n";
import { MarkdownBlocks } from "../lesson/Markdown";
import { parseMarkdown } from "../lesson/parseMarkdown";
import styles from "../pages/Pages.module.css";
import operatorsEn from "./js-operators.en.md?raw";
import operatorsVi from "./js-operators.vi.md?raw";

export function KnowledgePage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("nav.knowledge")}</h1>
      <Card>
        <h2 className={styles.planned}>JS</h2>
        <ul className={styles.topics}>
          <li>
            <Link to="/knowledge/js/operators">{t("nav.jsOperators")}</Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}

export function JsOperatorsPage() {
  const { locale, t } = useTranslation();
  const lesson = locale === "vi" ? operatorsVi : operatorsEn;

  return (
    <div className={styles.page}>
      <div>
        <Link to="/knowledge">{t("nav.knowledge")}</Link> / JS
      </div>
      <h1 className={styles.title}>{t("nav.jsOperators")}</h1>
      <Card>
        <MarkdownBlocks blocks={parseMarkdown(lesson)} />
      </Card>
    </div>
  );
}
