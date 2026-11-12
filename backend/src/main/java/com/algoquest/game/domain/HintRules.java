package com.algoquest.game.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Hint quota (FR-06, D-018): at most {@link #PER_WINDOW} hints in any {@link #WINDOW}. Each hint
 * comes back {@link #WINDOW} after it was opened.
 */
public final class HintRules {

  public static final int PER_WINDOW = 3;
  public static final Duration WINDOW = Duration.ofHours(5);

  private HintRules() {}

  /** Hints still available, from the times of the hints opened so far. */
  public static int remaining(List<Instant> openedAt, Instant now) {
    return remaining(GameRules.DEFAULTS, openedAt, now);
  }

  public static int remaining(GameRules rules, List<Instant> openedAt, Instant now) {
    return Math.max(0, rules.hintsPerWindow() - inWindow(rules, openedAt, now).size());
  }

  /** When the next hint comes back, or empty when none is in use. */
  public static Optional<Instant> nextRefill(List<Instant> openedAt, Instant now) {
    return nextRefill(GameRules.DEFAULTS, openedAt, now);
  }

  public static Optional<Instant> nextRefill(GameRules rules, List<Instant> openedAt, Instant now) {
    return inWindow(rules, openedAt, now).stream()
        .min(Instant::compareTo)
        .map(t -> t.plus(rules.hintWindow()));
  }

  private static List<Instant> inWindow(GameRules rules, List<Instant> openedAt, Instant now) {
    Instant from = now.minus(rules.hintWindow());
    return openedAt.stream().filter(t -> t.isAfter(from)).toList();
  }
}
