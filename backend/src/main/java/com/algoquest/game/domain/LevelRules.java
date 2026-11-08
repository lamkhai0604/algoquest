package com.algoquest.game.domain;

import java.util.List;
import java.util.OptionalInt;

/** Level unlocking, practice round, and level-up test rules (FR-09, FR-10, D-016). */
public final class LevelRules {

  public static final int PRACTICE_DONE_XP = 10;
  public static final int TEST_PROBLEMS = 3;

  private LevelRules() {}

  /**
   * The state of a level from the best test score of the level before it. Level 1 is always open.
   * Best scores only go up, so a level that opened never closes again.
   */
  public static LevelState state(int level, OptionalInt bestPreviousTestScore) {
    if (level == 1) {
      return LevelState.OPEN;
    }
    if (bestPreviousTestScore.isEmpty() || bestPreviousTestScore.getAsInt() < XpRules.PASS_SCORE) {
      return LevelState.LOCKED;
    }
    return bestPreviousTestScore.getAsInt() >= 100 ? LevelState.OPEN : LevelState.EASY_ONLY;
  }

  public static boolean canOpen(LevelState state, Difficulty difficulty) {
    return switch (state) {
      case OPEN -> true;
      case EASY_ONLY -> difficulty == Difficulty.EASY;
      case LOCKED -> false;
    };
  }

  /** XP shown on the level bar: never more than the target. */
  public static int barXp(int levelXp, int level) {
    return Math.min(levelXp, XpRules.levelTarget(level));
  }

  /** The practice round opens at 70% of the level target (FR-09.1). */
  public static boolean practiceOpen(int levelXp, int level) {
    return levelXp * 10 >= XpRules.levelTarget(level) * 7;
  }

  /** The level-up test opens when the bar is full (FR-10.1). */
  public static boolean testOpen(int levelXp, int level) {
    return levelXp >= XpRules.levelTarget(level);
  }

  /** XP for marking a practice problem Done: +10, but never past a full bar (FR-09.2). */
  public static int practiceDoneXp(int levelXp, int level) {
    return Math.max(0, Math.min(PRACTICE_DONE_XP, XpRules.levelTarget(level) - levelXp));
  }

  /**
   * Test score = average of the problem totals, rounded down; unanswered problems count as 0
   * (FR-10.2, FR-10.5).
   */
  public static int testScore(List<Integer> problemTotals) {
    if (problemTotals.size() > TEST_PROBLEMS) {
      throw new IllegalArgumentException("A test has " + TEST_PROBLEMS + " problems");
    }
    int sum = 0;
    for (int total : problemTotals) {
      if (total < 0 || total > 100) {
        throw new IllegalArgumentException("Problem totals are 0 to 100");
      }
      sum += total;
    }
    return sum / TEST_PROBLEMS;
  }

  /** Total XP is the sum of every level's XP (FR-08.4). */
  public static int totalXp(List<Integer> levelXp) {
    return levelXp.stream().mapToInt(Integer::intValue).sum();
  }
}
