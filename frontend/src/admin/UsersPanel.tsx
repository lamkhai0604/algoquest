import { useState } from "react";
import { api } from "../api";
import { useApiGet } from "../api/useApiGet";
import {
  Badge,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  ErrorState,
  LoadingState,
} from "../components";
import { useGame } from "../game/gameContext";
import styles from "./Admin.module.css";
import type { AdminUser, ResetResult } from "./types";

function ResetLevel({ user }: { user: AdminUser }) {
  const { levels, reloadLevels } = useGame();
  const [level, setLevel] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const choices =
    levels.status === "ready" ? levels.data.filter((l) => l.available) : [];

  const reset = () => {
    setConfirming(false);
    api
      .post<ResetResult>(`/api/v1/admin/users/${user.id}/progress-reset`, {
        level,
      })
      .then((result) => {
        setMessage(
          `Level ${level} reset: ${result.before.xp} XP and ${result.before.solved} solved problems removed.`,
        );
        reloadLevels();
      })
      .catch((failure: unknown) =>
        setMessage(failure instanceof Error ? failure.message : "Try again."),
      );
  };

  return (
    <div className={styles.reset}>
      <label htmlFor={`level-${user.id}`}>Reset level</label>
      <select
        id={`level-${user.id}`}
        value={level}
        onChange={(event) => {
          setLevel(Number(event.target.value));
          setConfirming(false);
        }}
      >
        {choices.map((l) => (
          <option key={l.number} value={l.number}>
            {l.number}. {l.title}
          </option>
        ))}
      </select>
      {confirming ? (
        <>
          <Button size="sm" onClick={reset}>
            Confirm reset of level {level}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setConfirming(true)}
        >
          Reset…
        </Button>
      )}
      {message && (
        <span className={styles.muted} role="status">
          {message}
        </span>
      )}
    </div>
  );
}

const ROLES = ["OWNER", "ADMIN", "PLAYER"] as const;

/** Grant or remove a global role; each change asks first and is audit-logged. */
function RoleEditor({
  user,
  onChanged,
}: {
  user: AdminUser;
  onChanged: (users: AdminUser[]) => void;
}) {
  const [asking, setAsking] = useState<{ role: string; grant: boolean } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const apply = () => {
    if (!asking) return;
    setBusy(true);
    const call = asking.grant
      ? api.post<AdminUser[]>(`/api/v1/admin/users/${user.id}/roles`, {
          role: asking.role,
        })
      : api.delete<AdminUser[]>(
          `/api/v1/admin/users/${user.id}/roles/${asking.role}`,
        );
    call
      .then((users) => {
        setMessage(null);
        onChanged(users);
      })
      .catch((failure: unknown) =>
        setMessage(failure instanceof Error ? failure.message : "Try again."),
      )
      .finally(() => {
        setBusy(false);
        setAsking(null);
      });
  };

  return (
    <div className={styles.reset}>
      <span>Roles</span>
      {ROLES.map((role) => {
        const has = user.roles.includes(role);
        return (
          <Chip
            key={role}
            selected={has}
            onToggle={() => setAsking({ role, grant: !has })}
          >
            {role}
          </Chip>
        );
      })}
      {message && (
        <span className={styles.muted} role="alert">
          {message}
        </span>
      )}
      {asking && (
        <ConfirmDialog
          title={
            asking.grant ? `Grant ${asking.role}?` : `Remove ${asking.role}?`
          }
          confirmLabel={asking.grant ? "Grant" : "Remove"}
          cancelLabel="Cancel"
          busy={busy}
          onConfirm={apply}
          onCancel={() => setAsking(null)}
        >
          {asking.grant
            ? `${user.email} gets every permission of ${asking.role}.`
            : `${user.email} loses the ${asking.role} role.`}{" "}
          The change is written to the audit log.
        </ConfirmDialog>
      )}
    </div>
  );
}

/** Users with their roles and a progress reset per level (FR-18.2, FR-18.4). */
export function UsersPanel() {
  const { state, reload } = useApiGet<AdminUser[]>("/api/v1/admin/users");
  const [changed, setChanged] = useState<AdminUser[] | null>(null);
  const users = changed ?? (state.status === "ready" ? state.data : []);
  return (
    <section className={styles.section}>
      {state.status === "loading" && <LoadingState label="Loading users…" />}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {state.status === "ready" &&
        users.map((user) => (
          <Card key={user.id}>
            <div className={styles.attemptHead}>
              <strong>{user.displayName}</strong>
              <span className={styles.muted}>{user.email}</span>
              {user.roles.map((role) => (
                <Badge
                  key={role}
                  tone={role === "OWNER" ? "primary" : "neutral"}
                >
                  {role}
                </Badge>
              ))}
            </div>
            <RoleEditor user={user} onChanged={setChanged} />
            <ResetLevel user={user} />
          </Card>
        ))}
    </section>
  );
}
