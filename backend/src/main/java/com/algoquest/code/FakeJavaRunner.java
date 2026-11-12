package com.algoquest.code;

import com.algoquest.content.model.Problem;
import com.algoquest.content.model.TestCase;
import java.util.ArrayList;
import java.util.List;
import tools.jackson.databind.json.JsonMapper;

/**
 * Java runner for tests and the smoke run, with fixed rules and no network. Code containing {@code
 * RUNNER-DOWN} is unavailable, {@code COMPILE-ERROR} does not compile, {@code FAIL} gets the first
 * test wrong; any other code passes every test.
 */
public class FakeJavaRunner implements JavaRunner {

  private static final JsonMapper JSON = JsonMapper.builder().build();

  @Override
  public JavaRun run(Problem problem, String code) {
    if (code.contains("RUNNER-DOWN")) {
      throw new RunnerUnavailableException("fake runner is down");
    }
    if (code.contains("COMPILE-ERROR")) {
      return new JavaRun(List.of(), "Main.java:3: error: ';' expected");
    }
    List<TestOutcome> outcomes = new ArrayList<>();
    for (TestCase test : problem.tests()) {
      outcomes.add(TestOutcome.of(JSON.valueToTree(test.expected())));
    }
    if (code.contains("FAIL") && !outcomes.isEmpty()) {
      outcomes.set(0, TestOutcome.of(JSON.valueToTree("wrong")));
    }
    return new JavaRun(outcomes, null);
  }
}
