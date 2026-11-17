import { useTheme } from "../theme/themeContext";
import { useTranslation } from "../i18n";
import { Button } from "./Button";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Button
      variant="ghost"
      size="sm"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={next === "light" ? t("misc.themeLight") : t("misc.themeDark")}
      title={next === "light" ? t("misc.themeLight") : t("misc.themeDark")}
    >
      {theme === "dark" ? "☀" : "☾"}
    </Button>
  );
}
