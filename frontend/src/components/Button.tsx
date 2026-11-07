import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "sm";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = cx(styles.button, styles[variant], styles[size], className);
  return <button type={type} className={classes} {...rest} />;
}
