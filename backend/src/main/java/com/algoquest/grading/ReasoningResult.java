package com.algoquest.grading;

/**
 * A graded Pattern Recognition reason (D-057). {@code reason} is 0/30/60 (how well the learner
 * explains what the chosen approach does here); {@code complexity} is 0/20/40 (whether the stated
 * time complexity of the chosen approach is right). Whether the choice itself is correct comes from
 * the content's labels, never from this result.
 */
public record ReasoningResult(int reason, int complexity, String feedback) {

  public int total() {
    return reason + complexity;
  }

  static ReasoningResult snapped(double reason, double complexity, String feedback) {
    return new ReasoningResult(
        GradingResult.snap(reason, 0, 30, 60),
        GradingResult.snap(complexity, 0, 20, 40),
        feedback == null ? "" : feedback.strip());
  }
}
