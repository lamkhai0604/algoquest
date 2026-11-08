package com.algoquest.content.model;

import java.util.List;
import java.util.Map;

/**
 * A problem file as stored in {@code content/}, including the answer key, hints, and hidden tests.
 * Only the backend reads this type; the API returns public views instead.
 */
public record Problem(
    String id,
    int level,
    String difficulty,
    String use,
    String status,
    String title,
    String statement,
    List<Example> examples,
    List<String> constraints,
    AnswerKey answerKey,
    List<String> hints,
    List<TestCase> tests,
    Map<String, String> starterCode,
    String similarLeetCode) {

  public boolean isReady() {
    return "ready".equals(status);
  }
}
