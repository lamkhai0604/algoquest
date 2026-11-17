import { useState } from "react";
import { useTranslation, localizeLabel } from "../i18n";
import { api } from "../api";
import { useApiGet } from "../api/useApiGet";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  LoadingState,
} from "../components";
import { useGame } from "../game/gameContext";
import type { GameRules } from "../solve/rules";
import styles from "./Admin.module.css";
import type { RulesView } from "./types";

type Field = { key: keyof GameRules; label: string; unit: string };

const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Problem XP",
    fields: [
      { key: "baseXp", label: "Base XP", unit: "XP" },
      { key: "mediumBonus", label: "Medium bonus", unit: "XP" },
      { key: "hardBonus", label: "Hard bonus", unit: "XP" },
      { key: "timeBonus", label: "Time bonus", unit: "XP" },
      { key: "hintPenaltyPercent", label: "XP off per hint", unit: "%" },
    ],
  },
  {
    title: "Time limits for the bonus",
    fields: [
      { key: "easyMinutes", label: "Easy", unit: "min" },
      { key: "mediumMinutes", label: "Medium", unit: "min" },
      { key: "hardMinutes", label: "Hard", unit: "min" },
    ],
  },
  {
    title: "Levels",
    fields: [
      { key: "levelTarget", label: "Level bar", unit: "XP" },
      { key: "passScore", label: "Pass mark", unit: "/ 100" },
      { key: "quickCheckXp", label: "Quick check", unit: "XP" },
      {
        key: "practiceOpenPercent",
        label: "Practice opens at",
        unit: "% of bar",
      },
      { key: "practiceDoneXp", label: "Practice Done", unit: "XP" },
    ],
  },
  {
    title: "Hints",
    fields: [
      { key: "hintsPerWindow", label: "Hints per window", unit: "hints" },
      { key: "hintWindowHours", label: "Window", unit: "hours" },
    ],
  },
];

function Form({
  view,
  onSaved,
}: {
  view: RulesView;
  onSaved: (v: RulesView) => void;
}) {
  const { reloadLevels } = useGame();
  const { t, locale } = useTranslation();
  const [draft, setDraft] = useState<GameRules>(view.current);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const changed = (Object.keys(draft) as (keyof GameRules)[]).filter(
    (key) => draft[key] !== view.current[key],
  );
  const easyXp = draft.baseXp + draft.timeBonus;
  const mediumXp = draft.baseXp + draft.mediumBonus + draft.timeBonus;
  const fullPass = 3 * easyXp + 3 * mediumXp + draft.quickCheckXp;

  const save = () => {
    setSaving(true);
    api
      .put<RulesView>("/api/v1/admin/game-rules", draft)
      .then((saved) => {
        setDraft(saved.current);
        setMessage(t("admin.saved"));
        onSaved(saved);
        reloadLevels();
      })
      .catch((failure: unknown) =>
        setMessage(
          failure instanceof Error ? failure.message : t("common.retry"),
        ),
      )
      .finally(() => {
        setSaving(false);
        setConfirming(false);
      });
  };

  return (
    <>
      {GROUPS.map((group) => (
        <Card key={group.title} heading={localizeLabel(locale, group.title)}>
          <div className={styles.rules}>
            {group.fields.map((field) => (
              <label key={field.key} className={styles.rule}>
                <span>
                  {localizeLabel(locale, field.label)}
                  {draft[field.key] !== view.defaults[field.key] && (
                    <Badge tone="xp">
                      {t("admin.defaultLabel")} {view.defaults[field.key]}
                    </Badge>
                  )}
                </span>
                <span className={styles.ruleInput}>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={draft[field.key]}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        [field.key]: Math.trunc(Number(event.target.value)),
                      })
                    }
                  />
                  <span className={styles.muted}>
                    {localizeLabel(locale, field.unit)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Card>
      ))}
      <Card>
        <p className={styles.muted}>
          {t("admin.ruleSummary")} {easyXp} {t("admin.ruleSummaryMid")}{" "}
          {mediumXp} {t("admin.ruleSummaryEnd")} {fullPass}{" "}
          {t("admin.ruleSummaryBar")} {draft.levelTarget} XP
          {fullPass < draft.levelTarget ? t("admin.ruleSummaryNotFull") : ""}.
        </p>
        <div className={styles.saveRow}>
          <Button
            variant="ghost"
            onClick={() => setDraft(view.defaults)}
            disabled={saving}
          >
            {t("admin.defaults")}
          </Button>
          <Button
            onClick={() => setConfirming(true)}
            disabled={saving || changed.length === 0}
          >
            {t("admin.save")}{" "}
            {changed.length > 0
              ? `${changed.length} ${t(changed.length > 1 ? "admin.changes" : "admin.change")}`
              : ""}
          </Button>
        </div>
        {message && (
          <p className={styles.muted} role="status">
            {message}
          </p>
        )}
      </Card>
      {confirming && (
        <ConfirmDialog
          title={t("admin.rulesConfirm")}
          confirmLabel={t("common.save")}
          cancelLabel={t("common.cancel")}
          busy={saving}
          onConfirm={save}
          onCancel={() => setConfirming(false)}
        >
          {changed
            .map((key) => `${key}: ${view.current[key]} → ${draft[key]}`)
            .join(", ")}
          . {t("admin.rulesConfirmInfo")}
        </ConfirmDialog>
      )}
    </>
  );
}

/** Game rules editor (FR-18.3, D-047). */
export function RulesEditor() {
  const { t } = useTranslation();
  const { state, reload } = useApiGet<RulesView>("/api/v1/admin/game-rules");
  const [saved, setSaved] = useState<RulesView | null>(null);
  const view = saved ?? (state.status === "ready" ? state.data : null);
  return (
    <section className={styles.section}>
      {state.status === "loading" && (
        <LoadingState label={t("admin.loadingRules")} />
      )}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {view && <Form view={view} onSaved={setSaved} />}
    </section>
  );
}
