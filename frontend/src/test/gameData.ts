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
  },
  {
    id: "L1-second-largest",
    title: "Second Largest Score",
    difficulty: "Medium",
    status: "ready",
    locked: false,
    solved: false,
    xp: 0,
  },
  {
    id: "L1-moving-median",
    title: "Moving Median",
    difficulty: "Hard",
    status: "comingSoon",
    locked: false,
    solved: false,
    xp: 0,
  },
];
