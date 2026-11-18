import { useState } from "react";
import { useTranslation } from "../i18n";
import { Link } from "react-router";
import { api } from "../api";
import { Button, Card } from "../components";
import type { Hints } from "../game/types";
import { refillIn } from "./rules";
import styles from "./Solve.module.css";

interface HintPanelProps {
  hints: Hints;
  problemId: string;
  onChange: (hints: Hints) => void;
}

/** Hints in order; each one costs 20% of this problem's XP (FR-06). */
export function HintPanel({ hints, problemId, onChange }: HintPanelProps) {
  const { t, locale } = useTranslation();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { opened, total, quota } = hints;
  const allOpen = opened.length >= total;

  const openNext = () => {
    setOpening(true);
    setError(null);
    api
      .post<Hints>(`/api/v1/problems/${problemId}/hints?lang=${locale}`)
      .then(onChange)
      .catch((failure: unknown) =>
        setError(
          failure instanceof Error ? failure.message : t("common.retry"),
        ),
      )
      .finally(() => setOpening(false));
  };

  return (
    <Card heading={t("solveMore.hints")}>
      {opened.map((hint, index) => (
        <p key={index} className={styles.hint}>
          <strong>
            {t("solveMore.hint")} {index + 1}.
          </strong>{" "}
          {hint}
        </p>
      ))}
      <p className={styles.muted}>
        {quota.remaining} of {quota.perWindow} {t("solveMore.hintsLeft")}
        {quota.refillsAt &&
          ` · ${t("solveMore.nextRefill")} ${refillIn(quota.refillsAt)}`}
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {!allOpen && quota.remaining > 0 && (
        <Button variant="secondary" disabled={opening} onClick={openNext}>
          {t("solveMore.showHint")} {opened.length + 1} of {total} (−20% XP)
        </Button>
      )}
      {!allOpen && quota.remaining === 0 && (
        <Link to="/vip" className={styles.vipLink}>
          {t("solveMore.getVip")}
        </Link>
      )}
    </Card>
  );
}
