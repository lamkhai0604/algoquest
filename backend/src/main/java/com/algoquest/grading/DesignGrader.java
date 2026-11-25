package com.algoquest.grading;

import com.algoquest.content.model.DesignPrompt;

/** Grades a written design with the System Design rubric (D-085). */
public interface DesignGrader {

  /**
   * Grades {@code answer} for {@code prompt}.
   *
   * @throws GraderUnavailableException when no grade could be produced
   */
  DesignResult grade(DesignPrompt prompt, DesignAnswer answer);

  /** A short name stored with each answer, for example the model ID and prompt version. */
  String name();
}
