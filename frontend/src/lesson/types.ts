export interface VisualMarker {
  index: number;
  label: string;
}

export interface VisualVariable {
  name: string;
  value: string;
}

/** A question asked before a step is shown; `hides` names the variables it keeps hidden. */
export interface Prediction {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  hides?: string[] | null;
}

/** What the visualizer draws for one step (cells, markers, variables). */
export interface Visual {
  cells: string[];
  markers?: VisualMarker[] | null;
  vars?: VisualVariable[] | null;
  predict?: Prediction | null;
  /** Indices of the two cells whose values this step exchanged. */
  swap?: [number, number] | null;
  /** Linked list: for each cell, the index its next points to, or -1 for null. */
  next?: number[] | null;
  /** Binary tree in array positions: children of i are 2i + 1 and 2i + 2; "" is no node. */
  tree?: boolean | null;
  /** Graph (D-060): pairs of cell indices; the cells are the vertices. */
  edges?: number[][] | null;
  /** Draw each edge as an arrow from its first vertex to its second. */
  directed?: boolean | null;
  /** Vertices drawn as visited. */
  visited?: number[] | null;
  /** [column, row] of each vertex on a 7 by 5 grid; a circle when absent. */
  positions?: number[][] | null;
  /** Edges this step travels, drawn highlighted (D-061). */
  activeEdges?: number[][] | null;
  /** The queue as vertex indices, front first, drawn as a strip (D-061). */
  queue?: number[] | null;
  /** Each vertex's ring (distance from the start), or -1; colours the vertices (D-061). */
  rings?: number[] | null;
  /** [start, end] of a range of cells to shade, such as a sliding window (D-063). */
  window?: number[] | null;
  /** A stack drawn as a strip, bottom first (D-065). */
  stack?: string[] | null;
  /** Makes a graph step an interactive BFS/DFS explorer (D-064). */
  explore?: boolean | null;
  /** One [start, end] per cell, drawn as bars on a time axis (D-066). */
  intervals?: number[][] | null;
  /** Indexes of kept intervals (D-066). */
  chosen?: number[] | null;
  /** A point in time drawn as a vertical sweep line (D-066). */
  line?: number | null;
  /** One label per edge, such as its cost (D-069). */
  weights?: string[] | null;
  /** Draws the cells as a table with this many rows (D-068). */
  rows?: number | null;
  rowLabels?: string[] | null;
  columnLabels?: string[] | null;
  /** Indexes of the cells this step reads, shaded (D-068). */
  reads?: number[] | null;
}

export interface WalkthroughStep {
  title: string;
  body: string;
  code?: string | null;
  visual?: Visual | null;
}

export interface QuickCheckQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface Lesson {
  level: number;
  title: string;
  markdown: string;
  walkthrough: WalkthroughStep[];
  quickCheck: QuickCheckQuestion[];
  /** An intuition question on the Understand step; answered for no XP. */
  intuition?: Prediction | null;
  /** Whether this player has finished the quick check (D-041). */
  quickCheckDone: boolean;
}

export interface QuickCheckResult {
  correct: boolean[];
  done: boolean;
  xpGained: number;
  levelXp: number;
  levelTarget: number;
}
