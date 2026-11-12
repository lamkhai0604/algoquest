package com.algoquest.game.domain;

import java.time.Duration;

/** Problem difficulty with its XP bonus and time-bonus limit (D-015, D-040). */
public enum Difficulty {
  EASY("Easy", 0, Duration.ofMinutes(15)),
  MEDIUM("Medium", 9, Duration.ofMinutes(25)),
  HARD("Hard", 20, Duration.ofMinutes(40));

  private final String label;
  private final int bonus;
  private final Duration timeLimit;

  Difficulty(String label, int bonus, Duration timeLimit) {
    this.label = label;
    this.bonus = bonus;
    this.timeLimit = timeLimit;
  }

  /** XP added on top of the base for this difficulty. */
  public int bonus() {
    return bonus;
  }

  /** Solving within this much active time earns the time bonus (D-043). */
  public Duration timeLimit() {
    return timeLimit;
  }

  public String label() {
    return label;
  }

  /** Reads the label used in content files ("Easy", "Medium", "Hard"). */
  public static Difficulty fromLabel(String label) {
    for (Difficulty difficulty : values()) {
      if (difficulty.label.equals(label)) {
        return difficulty;
      }
    }
    throw new IllegalArgumentException("Unknown difficulty: " + label);
  }
}
