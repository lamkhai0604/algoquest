import { useApiGet } from "../api/useApiGet";
import { Badge, Card, ErrorState, LoadingState } from "../components";
import styles from "./Admin.module.css";
import type { AuditEntry } from "./types";

function values(json: string | null): string {
  if (!json) return "—";
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(", ");
  } catch {
    return json;
  }
}

/** The audit log, newest first (FR-17.6). Entries are never changed. */
export function AuditLogPanel() {
  const { state, reload } = useApiGet<AuditEntry[]>("/api/v1/admin/audit-log");
  return (
    <section className={styles.section}>
      {state.status === "loading" && (
        <LoadingState label="Loading the audit log…" />
      )}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {state.status === "ready" && state.data.length === 0 && (
        <p className={styles.muted}>No admin actions yet.</p>
      )}
      {state.status === "ready" &&
        state.data.map((entry, index) => (
          <Card key={`${entry.at}-${index}`}>
            <div className={styles.attemptHead}>
              <Badge tone="primary">{entry.action}</Badge>
              <span className={styles.muted}>
                {new Date(entry.at).toLocaleString()}
              </span>
              <span className={styles.muted}>
                by {entry.actorEmail ?? "system"}
              </span>
              <span className={styles.muted}>
                on {entry.targetEmail ?? entry.target}
              </span>
            </div>
            <p className={styles.muted}>
              Before: {values(entry.before)} · After: {values(entry.after)}
            </p>
          </Card>
        ))}
    </section>
  );
}
