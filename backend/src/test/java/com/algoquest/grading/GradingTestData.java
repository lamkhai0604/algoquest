package com.algoquest.grading;

import com.algoquest.content.model.AnswerKey;
import com.algoquest.content.model.Example;
import com.algoquest.content.model.Problem;
import java.util.List;
import java.util.Map;

final class GradingTestData {

  private GradingTestData() {}

  static Problem problem() {
    AnswerKey key =
        new AnswerKey(
            "Single \"linear\" scan",
            List.of("Track the best value", "Return it"),
            "O(n)",
            "O(1)",
            List.of("Empty array"),
            List.of());
    return new Problem(
        "L1-max-temperature",
        1,
        "Easy",
        "practice",
        "ready",
        "Max Temperature",
        "Return the highest temperature.",
        List.of(new Example("[3, 9]", "9", null), new Example("[]", "null", null)),
        List.of("0 <= length <= 10^5"),
        key,
        List.of("a", "b", "c"),
        List.of(),
        Map.of("javascript", "f", "java", "g"),
        null,
        1);
  }
}
