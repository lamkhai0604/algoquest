package com.algoquest.grading;

import com.algoquest.content.model.PatternChallenge;

/**
 * Fixed rules for tests and the smoke run: the down marker makes grading unavailable; a reason of
 * at least 40 characters earns 60, a shorter one 30; mentioning the chosen approach's time
 * complexity earns 40.
 */
public class FakePatternGrader implements PatternGrader {

  @Override
  public ReasoningResult grade(
      PatternChallenge challenge, PatternChallenge.Approach chosen, String explanation) {
    if (explanation.contains(FakeGrader.DOWN_MARKER)) {
      throw new GraderUnavailableException("fake grader was asked to fail");
    }
    String text = explanation.replace(" ", "");
    int reason = explanation.strip().length() >= 40 ? 60 : 30;
    int complexity = text.contains(chosen.time().replace(" ", "")) ? 40 : 0;
    return new ReasoningResult(
        reason, complexity, complexity == 0 ? "State the time complexity." : "Clear reason.");
  }

  @Override
  public String name() {
    return "fake";
  }
}
