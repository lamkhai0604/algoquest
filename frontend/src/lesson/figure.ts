import type { Visual } from "./types";

/** One picture in a row of frames, such as the stack after "push(B)" (D-072). */
export type FigureFrame = {
  /** The operation that led to this frame, such as "push(B)". */
  op: string;
  /** Stack: bottom first. Queue: front first. */
  items?: string[];
  /** An item that left in this frame (popped or dequeued). */
  out?: string;
  /** Any other drawing (array, list, tree, graph), as a walkthrough Visual. */
  visual?: Visual;
};

export type Figure = {
  kind: "stack" | "queue" | "visual" | "image";
  caption?: string;
  frames?: FigureFrame[];
  /** For "image": a path under /lesson-images/, and its alt text. */
  src?: string;
  alt?: string;
};

const KINDS = ["stack", "queue", "visual", "image"];

/** How long each frame stays lit while a figure plays. */
export const FIGURE_FRAME_MS = 1400;

/** Reads a ```figure block; returns null when its JSON is not a figure. */
export function parseFigure(code: string): Figure | null {
  try {
    const value = JSON.parse(code) as Figure;
    return value && KINDS.includes(value.kind) ? value : null;
  } catch {
    return null;
  }
}
