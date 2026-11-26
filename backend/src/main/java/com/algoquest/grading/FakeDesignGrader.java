package com.algoquest.grading;

import com.algoquest.content.model.DesignPrompt;

/**
 * Fixed rules for tests and the smoke run: the down marker makes grading unavailable. Each section
 * of at least 40 characters earns its categories' full points and a shorter one half. In the
 * scaffold form the components section counts for both high-level design and data and scaling; in
 * the routine form the design and data sections count for them, and failures for trade-offs.
 */
public class FakeDesignGrader implements DesignGrader {

  @Override
  public DesignResult grade(DesignPrompt prompt, DesignAnswer answer) {
    String all = String.join("", answer.sections().values());
    if (all.contains(FakeGrader.DOWN_MARKER)) {
      throw new GraderUnavailableException("fake grader was asked to fail");
    }
    boolean routine = DesignPrompt.ROUTINE.equals(prompt.form());
    return new DesignResult(
        points(answer.get("requirements"), DesignResult.MAX_REQUIREMENTS),
        points(answer.get("estimate"), DesignResult.MAX_ESTIMATION),
        points(answer.get(routine ? "design" : "components"), DesignResult.MAX_DESIGN),
        points(answer.get(routine ? "data" : "components"), DesignResult.MAX_DATA),
        points(answer.get(routine ? "failures" : "failure"), DesignResult.MAX_TRADEOFFS),
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
