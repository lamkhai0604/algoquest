import { useState } from "react";
import { Button, Card } from "../components";
import styles from "./Lesson.module.css";
import { CodeBlock, InlineText } from "./Markdown";
import type { WalkthroughStep } from "./types";

/** The step-by-step example with Back and Next (FR-03.2). */
export function Walkthrough({ steps }: { steps: WalkthroughStep[] }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  if (!step) return null;
  return (
    <Card heading="Step by step">
      <div className={styles.step} aria-live="polite">
        <span className={styles.stepCount}>
          Step {index + 1} of {steps.length}
        </span>
        <h3 className={styles.stepTitle}>{step.title}</h3>
        <p>
          <InlineText text={step.body} />
        </p>
        {step.code && <CodeBlock code={step.code} />}
      </div>
      <div className={styles.stepButtons}>
        <Button
          variant="secondary"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          Back
        </Button>
        <Button
          disabled={index === steps.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          Next step
        </Button>
      </div>
    </Card>
  );
}
