import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./Button.module.css";
import type { ButtonVariant } from "./Button";
import { cx } from "./cx";

export interface ButtonLinkProps {
  to: string;
  variant?: ButtonVariant;
  size?: "md" | "sm";
  children: ReactNode;
}

/** A link that looks like a button, for navigation actions. */
export function ButtonLink({
  to,
  variant = "primary",
  size = "md",
  children,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cx(styles.button, styles.link, styles[variant], styles[size])}
    >
      {children}
    </Link>
  );
}
