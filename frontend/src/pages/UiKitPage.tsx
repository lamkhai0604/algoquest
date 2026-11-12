import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  LoadingState,
  WakingServer,
  XpBar,
} from "../components";
import styles from "./Pages.module.css";

/** Shared components in one place, for review and screenshots. */
export function UiKitPage() {
  const [language, setLanguage] = useState("JavaScript");
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>UI kit</h1>
      <div className={styles.grid}>
        <Card heading="Buttons">
          <div className={styles.row}>
            <Button>Submit explanation</Button>
            <Button variant="secondary">Get a hint</Button>
            <Button variant="ghost">Skip</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Card>
        <Card heading="Badges and chips">
          <div className={styles.row}>
            <Badge>Easy</Badge>
            <Badge tone="primary">Two pointers</Badge>
            <Badge tone="success">Passed</Badge>
            <Badge tone="xp">+40 XP</Badge>
            <Badge tone="warning">Coming soon</Badge>
          </div>
          <div className={styles.row}>
            {["JavaScript", "Java"].map((name) => (
              <Chip
                key={name}
                selected={language === name}
                onToggle={() => setLanguage(name)}
              >
                {name}
              </Chip>
            ))}
          </div>
        </Card>
        <Card heading="XP bars">
          <XpBar label="Level 1 · Big-O & Basics" value={210} max={300} />
          <XpBar label="Level 2 · Arrays & Hashing" value={45} max={300} />
        </Card>
        <Card heading="States">
          <LoadingState label="Grading your explanation…" />
          <ErrorState
            message="The grader did not answer. Your attempt was not used."
            onRetry={() => undefined}
          />
        </Card>
      </div>
      <WakingServer visible />
    </div>
  );
}
