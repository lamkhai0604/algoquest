package com.algoquest.grading;

import com.algoquest.content.model.PatternChallenge;

/** Grades the written reason for a Pattern Recognition choice (D-057). */
public interface PatternGrader {

  /**
   * Grades the reason given for {@code chosen}.
   *
   * @throws GraderUnavailableException when no grade could be produced
   */
  ReasoningResult grade(
      PatternChallenge challenge, PatternChallenge.Approach chosen, String explanation);

  /** A short name stored with each answer, for example the model ID and prompt version. */
  String name();
}
