import type { GameRules } from "../solve/rules";

export interface LoggedAttempt {
  id: string;
  userEmail: string;
  problemId: string;
  mode: string;
  explanation: string;
  pattern: number;
  steps: number;
  complexity: number;
  edgeCases: number;
  total: number;
  feedback: string;
  hintsUsed: number;
  secondsTaken: number;
  xpGained: number;
  grader: string;
  gradingMs: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  createdAt: string;
}

export interface LevelProgress {
  level: number;
  xp: number;
  solved: number;
  bestTestScore: number | null;
}

export interface ResetResult {
  before: LevelProgress;
  after: LevelProgress;
}

export interface RulesView {
  current: GameRules;
  defaults: GameRules;
}

export interface AuditEntry {
  at: string;
  actorEmail: string | null;
  action: string;
  target: string;
  targetEmail: string | null;
  before: string | null;
  after: string | null;
}
