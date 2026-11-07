import type { ReactNode } from "react";
import styles from "./Badge.module.css";
import { cx } from "./cx";

export type BadgeTone = "neutral" | "primary" | "success" | "xp" | "warning";

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return <span className={cx(styles.badge, styles[tone])}>{children}</span>;
}
