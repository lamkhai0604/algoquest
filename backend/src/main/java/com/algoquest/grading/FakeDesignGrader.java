package com.algoquest.grading;

import com.algoquest.content.model.DesignPrompt;

/**
 * Fixed rules for tests and the smoke run: the down marker makes grading unavailable. Each section
 * of at least 40 characters earns its categories' full points and a shorter one half; the
 * components section counts for both high-level design and data and scaling.
 */
public class FakeDesignGrader implements DesignGrader {

  @Override
  public DesignResult grade(DesignPrompt prompt, DesignAnswer answer) {
    String all = answer.requirements() + answer.estimate() + answer.components() + answer.failure();
    if (all.contains(FakeGrader.DOWN_MARKER)) {
      throw new GraderUnavailableException("fake grader was asked to fail");
    }
    return new DesignResult(
        points(answer.requirements(), DesignResult.MAX_REQUIREMENTS),
        points(answer.estimate(), DesignResult.MAX_ESTIMATION),
        points(answer.components(), DesignResult.MAX_DESIGN),
        points(answer.components(), DesignResult.MAX_DATA),
        points(answer.failure(), DesignResult.MAX_TRADEOFFS),
        "Clear structure.",
        "Explain each section in at least a sentence.");
  }

  private static int points(String text, int max) {
    return text.strip().length() >= 40 ? max : max / 2;
  }

  @Override
  public String name() {
    return "fake";
  }
}
