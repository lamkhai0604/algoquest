package com.algoquest.game.domain;

import java.time.Duration;

/** XP rules (FR-08, D-015, D-040). Pure functions with no framework or I/O. */
public final class XpRules {

  public static final int BASE_XP = 15;
  public static final int TIME_BONUS = 5;
  public static final int PASS_SCORE = 70;
  public static final int HINT_PENALTY_PERCENT = 20;

  /** XP for finishing a level's quick check, once (D-041). */
  public static final int QUICK_CHECK_XP = 5;

  /** The level bar for Levels 1–3, which share the same content shape (D-040). */
  public static final int LEVEL_TARGET = 150;

  private XpRules() {}

  /**
   * Problem XP = (base + difficulty bonus + time bonus) × (1 − 0.2 × hints, at least 0) × (2 if
   * code passed), rounded down.
   */
  public static int problemXp(
      Difficulty difficulty, Duration timeTaken, int hintsUsed, boolean codePassed) {
    if (hintsUsed < 0 || timeTaken.isNegative()) {
      throw new IllegalArgumentException("Hints and time must not be negative");
    }
    int raw = BASE_XP + difficulty.bonus();
    if (timeTaken.compareTo(difficulty.timeLimit()) <= 0) {
      raw += TIME_BONUS;
    }
    int percent = Math.max(0, 100 - HINT_PENALTY_PERCENT * hintsUsed);
    int xp = raw * percent / 100;
    return codePassed ? xp * 2 : xp;
  }

  /**
   * Applies one graded attempt. The first solve (score at least {@link #PASS_SCORE}) earns the
   * problem XP. After that, the only XP left is the code bonus, given once: it doubles what the
   * first solve earned.
   */
  public static XpAward award(
      ProblemProgress before,
      int score,
      Difficulty difficulty,
      Duration timeTaken,
      int hintsUsed,
      boolean codePassed) {
    if (score < PASS_SCORE) {
      return new XpAward(0, before);
    }
    if (!before.solved()) {
      int xp = problemXp(difficulty, timeTaken, hintsUsed, codePassed);
      return new XpAward(xp, new ProblemProgress(true, xp, codePassed));
    }
    if (codePassed && !before.codeBonusAwarded()) {
      int bonus = before.xpAwarded();
      return new XpAward(bonus, new ProblemProgress(true, before.xpAwarded() + bonus, true));
    }
    return new XpAward(0, before);
  }

  /**
   * XP needed to fill a level's bar: one full pass through the level, 3 Easy and 3 Medium problems
   * plus the quick check (D-040). Set again per level when a level's content changes.
   */
  public static int levelTarget(int level) {
    if (level < 1) {
      throw new IllegalArgumentException("Levels start at 1");
    }
    return LEVEL_TARGET;
  }
}
