package com.algoquest.grading;

import com.algoquest.content.model.Problem;

/** Grades a written explanation against a problem's answer key (FR-05). */
public interface Grader {

  /**
   * Grades one explanation.
   *
   * @throws GraderUnavailableException when no grade could be produced (failure, timeout, quota)
   */
  GradingResult grade(Problem problem, String levelTitle, String explanation);

  /** A short name stored with each attempt, for example the model ID. */
  String name();
}
