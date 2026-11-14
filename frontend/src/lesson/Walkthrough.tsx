import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Button, Card, cx } from "../components";
import styles from "./Lesson.module.css";
import { CodeBlock, InlineText } from "./Markdown";
import type { Prediction, Visual, WalkthroughStep } from "./types";

/** A prediction is answered with an option index, or skipped with "shown". */
type Answer = number | "shown";

function Cells({ visual }: { visual: Visual }) {
  const labels = new Map<number, string[]>();
  for (const marker of visual.markers ?? []) {
    labels.set(marker.index, [...(labels.get(marker.index) ?? []), marker.label]);
  }
  if (visual.cells.length === 0) return null;
  return (
    <ol className={styles.cells} aria-label="Items">
      {visual.cells.map((cell, index) => {
        const marks = labels.get(index);
        return (
          <li
            key={index}
            className={cx(styles.cell, marks && styles.cellCurrent)}
            aria-current={marks ? "true" : undefined}
          >
            <span className={styles.cellIndex}>[{index}]</span>
            <span className={styles.cellValue}>{cell}</span>
            <span className={styles.cellMarker}>{marks?.join(", ") ?? ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Variables({ visual, hidden }: { visual: Visual; hidden: string[] }) {
  if (!visual.vars?.length) return null;
  return (
    <dl className={styles.vars}>
      {visual.vars.map((variable) => (
        <div key={variable.name} className={styles.var}>
          <dt>{variable.name}</dt>
          <dd>{hidden.includes(variable.name) ? "?" : variable.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Predict({
  predict,
  answer,
  onAnswer,
}: {
  predict: Prediction;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
}) {
  const done = answer !== undefined;
  return (
    <fieldset className={styles.predict}>
      <legend>Predict before you reveal</legend>
      <p>
        <InlineText text={predict.question} />
      </p>
      <div className={styles.predictOptions}>
        {predict.options.map((option, index) => (
          <button
            key={index}
            type="button"
            className={cx(
              styles.option,
              done && index === predict.answer && styles.right,
              answer === index && index !== predict.answer && styles.wrong,
            )}
            aria-pressed={answer === index}
            disabled={done}
            onClick={() => onAnswer(index)}
          >
            {option}
          </button>
        ))}
      </div>
      {done ? (
        <p className={styles.answer} role="status">
          <strong>
            {answer === predict.answer
              ? "Correct."
              : answer === "shown"
                ? "Answer:"
                : "Not quite."}
          </strong>{" "}
          <InlineText text={predict.explanation} />
        </p>
      ) : (
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => onAnswer("shown")}
        >
          Show the answer
        </button>
      )}
    </fieldset>
  );
}

/** The state table: one row per step reached so far, one column per variable. */
function StateTable({
  steps,
  index,
  answers,
}: {
  steps: WalkthroughStep[];
  index: number;
  answers: Record<number, Answer>;
}) {
  const names: string[] = [];
  for (const step of steps) {
    for (const variable of step.visual?.vars ?? []) {
      if (!names.includes(variable.name)) names.push(variable.name);
    }
  }
  if (names.length === 0) return null;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.stateTable}>
        <caption>State after each step</caption>
        <thead>
          <tr>
            <th scope="col">Step</th>
            {names.map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {steps.slice(0, index + 1).map((step, i) => {
            const hidden =
              step.visual?.predict && answers[i] === undefined
                ? (step.visual.predict.hides ?? [])
                : [];
            return (
              <tr key={i} className={cx(i === index && styles.rowCurrent)}>
                <th scope="row">{i + 1}</th>
                {names.map((name) => {
                  const value = step.visual?.vars?.find(
                    (v) => v.name === name,
                  )?.value;
                  return (
                    <td key={name}>
                      {value === undefined
                        ? "·"
                        : hidden.includes(name)
                          ? "?"
                          : value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The step-by-step example (FR-03.2). Steps with a visual show the items,
 * markers, and variable values; a step with a prediction asks first and shows
 * its text once the learner answers. Arrow keys step, R resets.
 */
export function Walkthrough({ steps }: { steps: WalkthroughStep[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const step = steps[index];
  if (!step) return null;

  const visual = step.visual ?? null;
  const predict = visual?.predict ?? null;
  const waiting = predict !== null && answers[index] === undefined;
  const hidden = waiting ? (predict?.hides ?? []) : [];
  const last = index === steps.length - 1;
  const hasVisuals = steps.some((s) => s.visual);

  const go = (target: number) =>
    setIndex(Math.min(steps.length - 1, Math.max(0, target)));
  const reset = () => {
    setIndex(0);
    setAnswers({});
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("textarea, input")) return;
    if (event.key === "ArrowRight") go(index + 1);
    else if (event.key === "ArrowLeft") go(index - 1);
    else if (event.key === "r" || event.key === "R") reset();
    else return;
    event.preventDefault();
  };

  return (
    <div className={styles.visualizer}>
      <Card heading="Step by step" onKeyDown={onKeyDown}>
        <span className={styles.stepCount}>
          Step {index + 1} of {steps.length}
        </span>
        {visual && <Cells visual={visual} />}
        {visual && <Variables visual={visual} hidden={hidden} />}
        {predict && (
          <Predict
            predict={predict}
            answer={answers[index]}
            onAnswer={(answer) => setAnswers({ ...answers, [index]: answer })}
          />
        )}
        <div className={styles.step} aria-live="polite">
          <h3 className={styles.stepTitle}>{step.title}</h3>
          {waiting ? (
            <p className={styles.stepHidden}>
              Answer the question to see what happens in this step.
            </p>
          ) : (
            <>
              <p>
                <InlineText text={step.body} />
              </p>
              {step.code && <CodeBlock code={step.code} />}
            </>
          )}
        </div>
        <div className={styles.stepButtons}>
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            Back
          </Button>
          <Button disabled={last} onClick={() => go(index + 1)}>
            Next step
          </Button>
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
        <p className={styles.keys}>Keyboard: ← and → to step, R to reset.</p>
      </Card>
      {hasVisuals && (
        <Card>
          <StateTable steps={steps} index={index} answers={answers} />
        </Card>
      )}
    </div>
  );
}
