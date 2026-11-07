import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";
import { cx } from "./cx";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  heading?: ReactNode;
}

export function Card({ heading, className, children, ...rest }: CardProps) {
  return (
    <section className={cx(styles.card, className)} {...rest}>
      {heading && <h3 className={styles.heading}>{heading}</h3>}
      {children}
    </section>
  );
}
