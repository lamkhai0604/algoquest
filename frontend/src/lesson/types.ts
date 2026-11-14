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
