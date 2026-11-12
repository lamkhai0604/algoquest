export interface WalkthroughStep {
  title: string;
  body: string;
  code?: string | null;
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
