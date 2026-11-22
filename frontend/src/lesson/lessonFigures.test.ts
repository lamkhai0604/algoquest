import { describe, expect, it } from "vitest";
import { parseFigure } from "./figure";

/** Every lesson.md in content/, English and translated (D-072). */
const LESSONS = import.meta.glob<string>(
  "../../../content/levels/*/{lesson.md,locales/*/lesson.md}",
  { eager: true, query: "?raw", import: "default" },
);

/** The decorative images the frontend serves under /lesson-images/. */
const IMAGES = new Set(
  Object.keys(import.meta.glob("../../public/lesson-images/*.webp")).map(
    (path) => path.replace("../../public", ""),
  ),
);

const figures = (markdown: string) =>
  [...markdown.matchAll(/```figure\n([\s\S]*?)\n```/g)].map((m) => m[1]!);

describe("lesson figures in content", () => {
  it("every figure block is a valid figure", () => {
    let count = 0;
    for (const [path, markdown] of Object.entries(LESSONS)) {
      for (const block of figures(markdown)) {
        expect(parseFigure(block), `${path}: ${block}`).not.toBeNull();
        count++;
      }
    }
    // Levels 2, 3, 5, 6, 8, 9 and 10 have 11 figures between them.
    expect(Object.keys(LESSONS).length).toBeGreaterThanOrEqual(27);
    expect(count).toBeGreaterThanOrEqual(11);
  });

  it("every image figure points at a file in public/lesson-images", () => {
    for (const [path, markdown] of Object.entries(LESSONS)) {
      for (const block of figures(markdown)) {
        const figure = parseFigure(block);
        if (figure?.kind !== "image") continue;
        expect(IMAGES.has(figure.src ?? ""), `${path}: ${figure.src}`).toBe(
          true,
        );
      }
    }
  });

  it("stack and queue frames replay their operations", () => {
    for (const [path, markdown] of Object.entries(LESSONS)) {
      for (const block of figures(markdown)) {
        const figure = parseFigure(block);
        if (figure?.kind !== "stack" && figure?.kind !== "queue") continue;
        const frames = figure.frames ?? [];
        for (let i = 1; i < frames.length; i++) {
          const before = frames[i - 1]!.items ?? [];
          const frame = frames[i]!;
          const after = frame.items ?? [];
          const removed =
            figure.kind === "stack" ? before.at(-1) : before.at(0);
          const rest =
            figure.kind === "stack" ? before.slice(0, -1) : before.slice(1);
          const where = `${path}, frame ${i + 1} (${frame.op})`;
          if (frame.out !== undefined) {
            expect(frame.out, where).toBe(removed);
            expect(after, where).toEqual(rest);
          } else {
            // A push or enqueue adds one item at the end.
            expect(after.slice(0, -1), where).toEqual(before);
            expect(after.length, where).toBe(before.length + 1);
          }
        }
      }
    }
  });
});
