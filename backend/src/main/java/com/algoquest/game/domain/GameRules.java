package com.algoquest.game.domain;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Every number the game rules use, in one record (D-047). The Owner edits it on the admin page;
 * {@link #DEFAULTS} holds the values of D-040.
 *
 * @param baseXp XP of any solved problem before bonuses
 * @param mediumBonus extra XP for a Medium problem
 * @param hardBonus extra XP for a Hard problem
 * @param timeBonus extra XP for finishing within the time limit
 * @param easyMinutes active minutes for the time bonus on an Easy problem
 * @param mediumMinutes the same for Medium
 * @param hardMinutes the same for Hard
 * @param hintPenaltyPercent XP taken off a problem per hint
 * @param hintsPerWindow hints a player may open within the window
 * @param hintWindowHours the rolling hint window
 * @param passScore the score that solves a problem and passes a level-up test
 * @param practiceOpenPercent share of the level bar that opens the practice round
 * @param practiceDoneXp XP for a problem marked Done in the practice round
 * @param quickCheckXp XP for finishing a lesson's quick check
 * @param levelTarget XP that fills a level's bar
 */
public record GameRules(
    int baseXp,
    int mediumBonus,
    int hardBonus,
    int timeBonus,
    int easyMinutes,
    int mediumMinutes,
    int hardMinutes,
    int hintPenaltyPercent,
    int hintsPerWindow,
    int hintWindowHours,
    int passScore,
    int practiceOpenPercent,
    int practiceDoneXp,
    int quickCheckXp,
    int levelTarget) {

  public static final GameRules DEFAULTS =
      new GameRules(15, 9, 20, 5, 15, 25, 40, 20, 3, 5, 70, 70, 10, 5, 150);

  public int bonus(Difficulty difficulty) {
    return switch (difficulty) {
      case EASY -> 0;
      case MEDIUM -> mediumBonus;
      case HARD -> hardBonus;
    };
  }

  public Duration timeLimit(Difficulty difficulty) {
    return Duration.ofMinutes(
        switch (difficulty) {
          case EASY -> easyMinutes;
          case MEDIUM -> mediumMinutes;
          case HARD -> hardMinutes;
        });
  }

  public Duration hintWindow() {
    return Duration.ofHours(hintWindowHours);
  }

  /** What is wrong with these values; empty when they can be used. */
  public List<String> problems() {
    List<String> problems = new ArrayList<>();
    check(problems, "baseXp", baseXp, 1, 200);
    check(problems, "mediumBonus", mediumBonus, 0, 200);
    check(problems, "hardBonus", hardBonus, 0, 200);
    check(problems, "timeBonus", timeBonus, 0, 100);
    check(problems, "easyMinutes", easyMinutes, 1, 240);
    check(problems, "mediumMinutes", mediumMinutes, 1, 240);
    check(problems, "hardMinutes", hardMinutes, 1, 240);
    check(problems, "hintPenaltyPercent", hintPenaltyPercent, 0, 100);
    check(problems, "hintsPerWindow", hintsPerWindow, 0, 20);
    check(problems, "hintWindowHours", hintWindowHours, 1, 48);
    check(problems, "passScore", passScore, 1, 100);
    check(problems, "practiceOpenPercent", practiceOpenPercent, 1, 100);
    check(problems, "practiceDoneXp", practiceDoneXp, 0, 100);
    check(problems, "quickCheckXp", quickCheckXp, 0, 100);
    check(problems, "levelTarget", levelTarget, 10, 2000);
    if (problems.isEmpty() && (easyMinutes > mediumMinutes || mediumMinutes > hardMinutes)) {
      problems.add("Time limits must grow from Easy to Medium to Hard");
    }
    return problems;
  }

  private static void check(List<String> problems, String name, int value, int min, int max) {
    if (value < min || value > max) {
      problems.add(name + " must be " + min + " to " + max);
    }
  }
}
