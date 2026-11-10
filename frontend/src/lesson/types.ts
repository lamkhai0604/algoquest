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
}
