package com.algoquest.grading;

import com.algoquest.content.model.Problem;

/**
 * A grader with fixed rules, for tests and the smoke run (no network, no quota). Text containing
 * the down marker makes grading unavailable; text of at least 60 characters scores 95; shorter text
 * scores 35.
 */
public class FakeGrader implements Grader {

  public static final String DOWN_MARKER = "GRADER-DOWN";

  @Override
  public GradingResult grade(Problem problem, String levelTitle, String explanation) {
    if (explanation.contains(DOWN_MARKER)) {
      throw new GraderUnavailableException("fake grader was asked to fail");
    }
    if (explanation.strip().length() >= 60) {
      return new GradingResult(40, 30, 20, 5, "Clear approach. Say how each edge case is handled.");
    }
    return new GradingResult(20, 15, 0, 0, "Add the steps, the complexity, and an edge case.");
  }

  @Override
  public String name() {
    return "fake";
  }
}
