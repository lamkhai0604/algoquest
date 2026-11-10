package com.algoquest.grading;

/**
 * A graded explanation (FR-05.2). Each criterion holds one of its allowed values: pattern 0/20/40,
 * steps 0/15/30, complexity 0/10/20, edge cases 0/5/10.
 */
public record GradingResult(
    int pattern, int steps, int complexity, int edgeCases, String feedback) {

  public static final int PASS_TOTAL = 70;

  public int total() {
    return pattern + steps + complexity + edgeCases;
  }

  /** Builds a result from raw model scores, moving each to the nearest allowed value. */
  public static GradingResult snapped(
      double pattern, double steps, double complexity, double edgeCases, String feedback) {
    return new GradingResult(
        snap(pattern, 0, 20, 40),
        snap(steps, 0, 15, 30),
        snap(complexity, 0, 10, 20),
        snap(edgeCases, 0, 5, 10),
        feedback == null ? "" : feedback.strip());
  }

  static int snap(double value, int... allowed) {
    if (Double.isNaN(value) || Double.isInfinite(value)) {
      return allowed[0];
    }
    int best = allowed[0];
    for (int option : allowed) {
      if (Math.abs(option - value) < Math.abs(best - value)) {
        best = option;
      }
    }
    return best;
  }
}
