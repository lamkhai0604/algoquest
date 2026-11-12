package com.algoquest.code;

import static org.assertj.core.api.Assertions.assertThat;

import com.algoquest.content.model.AnswerKey;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.TestCase;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class JavaHarnessTest {

  private static final JsonMapper JSON = JsonMapper.builder().build();

  private static Problem problem(String javaStarter, List<TestCase> tests) {
    return new Problem(
        "L9-sample",
        1,
        "Easy",
        "practice",
        "ready",
        "Sample",
        "Sample",
        List.of(),
        List.of(),
        new AnswerKey("p", List.of("k"), "O(n)", "O(1)", List.of("e"), List.of()),
        List.of("a", "b", "c"),
        tests,
        Map.of("javascript", "function f(a) {\n}", "java", javaStarter),
        null,
        1);
  }

  @Test
  void readsTheMethodSignatureFromTheStarterCode() {
    Problem p =
        problem(
            "class Solution {\n  int[] twoTickets(int[] prices, int budget) {\n  }\n}", List.of());

    JavaHarness.Signature signature = JavaHarness.signature(p);

    assertThat(signature.name()).isEqualTo("twoTickets");
    assertThat(signature.parameterTypes()).containsExactly("int[]", "int");
  }

  @Test
  void writesJavaLiteralsForEachParameterType() {
    assertThat(JavaHarness.literal("int[]", JSON.valueToTree(List.of(3, -2))))
        .isEqualTo("new int[]{3, -2}");
    assertThat(JavaHarness.literal("String", JSON.valueToTree("say \"hi\"\\")))
        .isEqualTo("\"say \\\"hi\\\"\\\\\"");
    assertThat(JavaHarness.literal("char[]", JSON.valueToTree(List.of("h", "'"))))
        .isEqualTo("new char[]{'h', '\\''}");
    assertThat(JavaHarness.literal("String[]", JSON.valueToTree(List.of("mai", "an"))))
        .isEqualTo("new String[]{\"mai\", \"an\"}");
    assertThat(JavaHarness.literal("long", JSON.valueToTree(7))).isEqualTo("7L");
    assertThat(JavaHarness.literal("boolean", JSON.valueToTree(true))).isEqualTo("true");
    assertThat(JavaHarness.literal("int[][]", JSON.valueToTree(List.of(List.of(1), List.of()))))
        .isEqualTo("new int[][]{new int[]{1}, new int[]{}}");
    assertThat(JavaHarness.literal("Integer", JSON.nullNode())).isEqualTo("(Integer) null");
  }

  @Test
  void buildsOneProgramThatCallsTheMethodForEveryTest() {
    Problem p =
        problem(
            "class Solution {\n  int countPassing(int[] scores, int mark) {\n  }\n}",
            List.of(
                new TestCase(Arrays.asList(List.of(55, 70), 70), 1),
                new TestCase(Arrays.asList(List.of(), 50), 0)));

    JavaHarness.Program program =
        JavaHarness.build(p, "class Solution { int countPassing(int[] s, int m) { return 0; } }");

    assertThat(program.source())
        .contains("public class Main")
        .contains("new Solution().countPassing(new int[]{55, 70}, 70)")
        .contains("new Solution().countPassing(new int[]{}, 50)")
        .contains("class Solution { int countPassing");
    assertThat(program.marker()).startsWith("@@").hasSize(14);
  }

  @Test
  void readsOnlyMarkedLinesAndKeepsMissingTestsAsFailed() {
    String out = "debug print\n@@abc0 [1,7]\n@@abc2 !ArithmeticException\n@@xyz1 99\n";

    List<TestOutcome> outcomes = JavaHarness.outcomes(out, "@@abc", 3);

    assertThat(outcomes.get(0).output()).isEqualTo(JSON.valueToTree(List.of(1, 7)));
    assertThat(outcomes.get(1).error()).isEqualTo("did not finish");
    assertThat(outcomes.get(2).error()).isEqualTo("ArithmeticException");
  }
}
