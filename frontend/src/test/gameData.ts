import type { Level, ProblemItem } from "../game/types";

const level = (number: number, title: string, rest: Partial<Level>): Level => ({
  number,
  slug: `level-${number}`,
  title,
  summary: `Summary of ${title}.`,
  available: true,
  state: "LOCKED",
  xp: 0,
  target: 100 + 25 * (number - 1),
  practiceOpen: false,
  testOpen: false,
  problems: 0,
  solved: 0,
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
    xp: 25,
    practiceDone: false,
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
  },
];

export const PROBLEM = {
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
};

export const GRADED = {
  attemptId: "a-1",
  mode: "explain",
  pattern: 40,
  steps: 30,
  complexity: 20,
  edgeCases: 5,
  total: 95,
  solved: true,
  feedback: "Clear approach. Say how the empty array is handled.",
  xpGained: 25,
  levelXp: 65,
  levelTarget: 100,
};
