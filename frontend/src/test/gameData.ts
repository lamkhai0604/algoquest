import type { Level, ProblemItem } from "../game/types";
import type { AttemptResult, ProblemDetail } from "../solve/types";

const level = (number: number, title: string, rest: Partial<Level>): Level => ({
  number,
  slug: `level-${number}`,
  title,
  summary: `Summary of ${title}.`,
  available: true,
  state: "LOCKED",
  xp: 0,
  target: 150,
  practiceOpen: false,
  testOpen: false,
  problems: 0,
  solved: 0,
  bestTestScore: null,
  ...rest,
});

export const LEVELS: Level[] = [
  level(1, "Big-O & Basics", { state: "OPEN", xp: 40, problems: 6, solved: 1 }),
  level(2, "Arrays & Hashing", {}),
  level(3, "Two Pointers", { available: false }),
];

export const PROBLEMS: ProblemItem[] = [
  {
    id: "L1-max-temperature",
    title: "Max Temperature",
    difficulty: "Easy",
    status: "ready",
    locked: false,
    solved: true,
    xp: 20,
    practiceDone: false,
    tried: true,
    paused: false,
  },
  {
    id: "L1-second-largest",
    title: "Second Largest Score",
    difficulty: "Medium",
    status: "ready",
    locked: false,
    solved: false,
    xp: 0,
    practiceDone: false,
    tried: false,
    paused: false,
  },
  {
    id: "L1-moving-median",
    title: "Moving Median",
    difficulty: "Hard",
    status: "comingSoon",
    locked: false,
    solved: false,
    xp: 0,
    practiceDone: false,
    tried: false,
    paused: false,
  },
];

export const PROBLEM: ProblemDetail = {
  id: "L1-max-temperature",
  level: 1,
  title: "Max Temperature",
  difficulty: "Easy",
  statement: "Return the highest temperature, or null for an empty array.",
  examples: [
    { input: "[3, -2, 9, 4]", output: "9" },
    { input: "[]", output: "null", explanation: "Nothing to compare." },
  ],
  constraints: ["0 <= temps.length <= 10^5"],
  hintCount: 3,
  starterCode: {
    javascript: "function maxTemperature(temps) {\n}",
    java: "class Solution {\n  Integer maxTemperature(int[] temps) {\n  }\n}",
  },
  activeSeconds: 0,
  lastResult: null,
  nextProblemId: "L1-second-largest",
};

export const GRADED: AttemptResult = {
  attemptId: "a-1",
  mode: "explain",
  explanation: "Walk the array once and keep the largest value so far.",
  pattern: 40,
  steps: 30,
  complexity: 20,
  edgeCases: 5,
  total: 95,
  solved: true,
  feedback: "Clear approach. Say how the empty array is handled.",
  xpGained: 20,
  levelXp: 65,
  levelTarget: 150,
};
