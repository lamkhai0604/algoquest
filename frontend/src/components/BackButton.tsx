import { Link } from "react-router";
import styles from "./BackButton.module.css";

interface BackButtonProps {
  /** Where the button leads. */
  to: string;
  /** What the button does, for example "Back to the level map". */
  label: string;
}

/** A round button with a left arrow: the same way back on every page. */
export function BackButton({ to, label }: BackButtonProps) {
  return (
    <Link to={to} className={styles.back} aria-label={label} title={label}>
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 5 8 12l7 7" />
      </svg>
    </Link>
  );
}
