import type { ReactNode } from "react";
import styles from "./Chip.module.css";

export interface ChipProps {
  selected?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}

/** A toggle button for filters and options. */
export function Chip({ selected = false, onToggle, children }: ChipProps) {
  return (
    <button
      type="button"
      className={styles.chip}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {children}
    </button>
  );
}
