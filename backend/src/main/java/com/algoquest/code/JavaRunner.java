package com.algoquest.code;

import com.algoquest.content.model.Problem;

/** Runs a player's Java code against a problem's hidden tests (D-032). */
public interface JavaRunner {

  /**
   * Runs the code once with every hidden test.
   *
   * @throws RunnerUnavailableException when the runner cannot be reached or refuses the run
   */
  JavaRun run(Problem problem, String code);
}
