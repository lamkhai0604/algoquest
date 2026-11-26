/** Design prompts (D-085). Criteria never reach the client; the reference arrives with a grade. */
/** The four headings of early prompts. */
export type ScaffoldSection =
  "requirements" | "estimate" | "components" | "failure";

/** The eight steps of the full design interview routine (Level 42 on, T-699). */
export type RoutineSection =
  | "requirements"
  | "estimate"
  | "api"
  | "data"
  | "design"
  | "deepdive"
  | "failures"
  | "summary";

export type DesignSection = ScaffoldSection | RoutineSection;

export type DesignForm = "scaffold" | "routine";

export type RubricCategory =
  "requirements" | "estimation" | "design" | "data" | "tradeoffs";

export interface PromptSummary {
  id: string;
  title: string;
  /** This player's best total out of 100, or null if not tried. */
  bestScore: number | null;
}

export interface PromptView {
  id: string;
  level: number;
  levelTitle: string;
  title: string;
  prompt: string;
  facts: string[];
  scope: string[];
  form: DesignForm;
  sections: DesignSection[];
  answersLeftToday: number;
}

export interface CategoryScore {
  category: RubricCategory;
  points: number;
  max: number;
}

export interface Reference {
  assumptions: string[];
  design: string;
  alternatives: string[];
}

export interface DesignResult {
  total: number;
  categories: CategoryScore[];
  strengths: string;
  improve: string;
  reference: Reference;
  answersLeftToday: number;
}

export type DesignAnswer = Partial<Record<DesignSection, string>>;
