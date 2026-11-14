import { BackButton, Badge, Card } from "../components";
import styles from "./Pages.module.css";

const PERKS = [
  "10 hints every 5 hours instead of 3",
  "Hard problems and hard test mode as soon as they are ready",
  "A monthly progress summary",
];

/** VIP placeholder (FR-15): sample content only, no payment or sign-up. */
export function VipPage() {
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <BackButton to="/" label="Back to the Learning Path" />
        <h1 className={styles.title}>AlgoQuest VIP</h1>
      </div>
      <Card>
        <Badge tone="warning">Coming soon</Badge>
        <p className={styles.lead}>
          A future monthly plan for players who want more help. Nothing on this
          page can be bought yet.
        </p>
        <ul>
          {PERKS.map((perk) => (
            <li key={perk}>{perk}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
