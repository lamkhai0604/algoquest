import { describe, expect, it } from "vitest";
import type { WalkthroughStep } from "./types";

/** The real walkthroughs in content/, checked against reference algorithms. */
const FILES = import.meta.glob<WalkthroughStep[]>(
  "../../../content/levels/*/walkthrough.json",
  { eager: true, import: "default" },
);

function walkthrough(folder: string): WalkthroughStep[] {
  const steps = FILES[`../../../content/levels/${folder}/walkthrough.json`];
  if (!steps) throw new Error(`no walkthrough for ${folder}`);
  return steps;
}

const value = (step: WalkthroughStep, name: string) =>
  step.visual?.vars?.find((v) => v.name === name)?.value;

describe("lesson visualizers match their reference algorithms", () => {
  it("Level 1: best is the running maximum at every step", () => {
    const steps = walkthrough("1-big-o-and-basics");
    let checked = 0;
    for (const step of steps) {
      const marker = step.visual?.markers?.[0];
      const best = value(step, "best");
      if (!step.visual || marker === undefined || best === undefined) continue;
      const seen = step.visual.cells.slice(0, marker.index + 1).map(Number);
      expect(Number(best)).toBe(Math.max(...seen));
      expect(value(step, "current")).toBe(step.visual.cells[marker.index]);
      checked++;
    }
    expect(checked).toBe(4);
    expect(value(steps.at(-1)!, "result")).toBe("9");
  });

  it("Level 2: the last step shows the run-length encoding of the cells", () => {
    const steps = walkthrough("2-arrays-and-strings");
    const text = steps[0]!.visual!.cells.join("");
    const encoded = text.replace(
      /(.)\1*/g,
      (run, ch: string) => `${ch}${run.length}`,
    );
    expect(value(steps.at(-1)!, "result")).toBe(`"${encoded}"`);
  });

  it("Level 3: the duplicate is found at the first repeated value", () => {
    const steps = walkthrough("3-hashing");
    const cells = steps[0]!.visual!.cells;
    const seen = new Set<string>();
    const repeat = cells.findIndex((c) => seen.has(c) || !seen.add(c));
    const last = steps.at(-1)!;
    expect(last.visual!.markers![0]!.index).toBe(repeat);
    expect(value(last, "result")).toBe("true");
  });

  it("every prediction's answer is one of its options", () => {
    for (const folder of [
      "1-big-o-and-basics",
      "2-arrays-and-strings",
      "3-hashing",
    ]) {
      for (const step of walkthrough(folder)) {
        const predict = step.visual?.predict;
        if (!predict) continue;
        expect(predict.options[predict.answer]).toBeDefined();
        for (const name of predict.hides ?? []) {
          expect(value(step, name)).toBeDefined();
        }
      }
    }
  });
});
