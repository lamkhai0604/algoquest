import { useState } from "react";
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
        setMessage("Saved. The new rules apply from the next request.");
        onSaved(saved);
        reloadLevels();
      })
      .catch((failure: unknown) =>
        setMessage(failure instanceof Error ? failure.message : "Try again."),
      )
      .finally(() => {
        setSaving(false);
        setConfirming(false);
      });
  };

  return (
    <>
      {GROUPS.map((group) => (
        <Card key={group.title} heading={group.title}>
          <div className={styles.rules}>
            {group.fields.map((field) => (
              <label key={field.key} className={styles.rule}>
                <span>
                  {field.label}
                  {draft[field.key] !== view.defaults[field.key] && (
                    <Badge tone="xp">default {view.defaults[field.key]}</Badge>
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
                  <span className={styles.muted}>{field.unit}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>
      ))}
      <Card>
        <p className={styles.muted}>
          With these values an Easy problem earns {easyXp} XP and a Medium one{" "}
          {mediumXp} XP. A full pass through a level (3 Easy, 3 Medium, quick
          check) earns {fullPass} XP against a bar of {draft.levelTarget} XP
          {fullPass < draft.levelTarget ? " — the bar would not fill" : ""}.
        </p>
        <div className={styles.saveRow}>
          <Button
            variant="ghost"
            onClick={() => setDraft(view.defaults)}
            disabled={saving}
          >
            Use defaults
          </Button>
          <Button
            onClick={() => setConfirming(true)}
            disabled={saving || changed.length === 0}
          >
            Save{" "}
            {changed.length > 0
              ? `${changed.length} change${changed.length > 1 ? "s" : ""}`
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
          title="Change the game rules?"
          confirmLabel="Save"
          cancelLabel="Cancel"
          busy={saving}
          onConfirm={save}
          onCancel={() => setConfirming(false)}
        >
          {changed
            .map((key) => `${key}: ${view.current[key]} → ${draft[key]}`)
            .join(", ")}
          . XP already earned stays as it is. The change is written to the audit
          log.
        </ConfirmDialog>
      )}
    </>
  );
}

/** Game rules editor (FR-18.3, D-047). */
export function RulesEditor() {
  const { state, reload } = useApiGet<RulesView>("/api/v1/admin/game-rules");
  const [saved, setSaved] = useState<RulesView | null>(null);
  const view = saved ?? (state.status === "ready" ? state.data : null);
  return (
    <section className={styles.section}>
      {state.status === "loading" && <LoadingState label="Loading rules…" />}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {view && (
        <Form
          key={JSON.stringify(view.current)}
          view={view}
          onSaved={setSaved}
        />
      )}
    </section>
  );
}
