package com.algoquest.game.domain;

import java.time.LocalDate;

/**
 * Daily streak (FR-13): +1 for each calendar day with at least one solved problem; a missed day
 * resets it.
 */
public final class StreakRules {

  /** A stored streak. {@code lastActiveDay} is null before the first solve. */
  public record Streak(int current, int best, LocalDate lastActiveDay) {

    public static final Streak NONE = new Streak(0, 0, null);
  }

  private StreakRules() {}

  /** The streak after a solve on {@code today}. */
  public static Streak recordSolve(Streak before, LocalDate today) {
    LocalDate last = before.lastActiveDay();
    if (last != null && !today.isAfter(last)) {
      return before; // already counted today (or a clock moved back)
    }
    int current = last != null && last.plusDays(1).equals(today) ? before.current() + 1 : 1;
    return new Streak(current, Math.max(before.best(), current), today);
  }

  /** The streak to show on {@code today}: 0 once a whole day was missed. */
  public static int current(Streak streak, LocalDate today) {
    LocalDate last = streak.lastActiveDay();
    if (last == null || last.plusDays(1).isBefore(today)) {
      return 0;
    }
    return streak.current();
  }
}
