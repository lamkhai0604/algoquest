package com.algoquest.code;

import static org.assertj.core.api.Assertions.assertThat;

import com.algoquest.content.model.AnswerKey;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.TestCase;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;
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
  void readsListArgumentsAndResultsFromTheStarterCode() {
    Problem p =
        problem(
            "class Solution {\n  ListNode merge(ListNode a, int x, ListNode b) {\n  }\n}",
            List.of());

    JavaHarness.Signature signature = JavaHarness.signature(p);

    assertThat(signature.listArguments()).containsExactly(0, 2);
    assertThat(signature.returnsList()).isTrue();
    assertThat(JavaHarness.literal("ListNode", JSON.valueToTree(List.of(1, 2))))
        .isEqualTo("ListNode.of(new int[]{1, 2})");
    assertThat(JavaHarness.literal("ListNode", JSON.valueToTree(List.of())))
        .isEqualTo("ListNode.of(new int[]{})");
  }

  @Test
  void runsListCodeAndStopsAtACycle() throws Exception {
    Problem p =
        problem(
            "class Solution {\n  ListNode reverse(ListNode head) {\n  }\n}",
            List.of(
                new TestCase(List.of(List.of(1, 2, 3)), List.of(3, 2, 1)),
                new TestCase(List.of(List.of()), List.of()),
                new TestCase(List.of(List.of(7, 7)), List.of())));
    String code =
        "class Solution {\n"
            + "  ListNode reverse(ListNode head) {\n"
            + "    if (head != null && head.val == 7) { head.next.next = head; return head; }\n"
            + "    ListNode prev = null;\n"
            + "    while (head != null) {\n"
            + "      ListNode next = head.next;\n"
            + "      head.next = prev;\n"
            + "      prev = head;\n"
            + "      head = next;\n"
            + "    }\n"
            + "    return prev;\n"
            + "  }\n"
            + "}";

    JavaHarness.Program program = JavaHarness.build(p, code);
    List<TestOutcome> outcomes =
        JavaHarness.outcomes(compileAndRun(program.source()), program.marker(), 3);

    assertThat(outcomes.get(0).output()).isEqualTo(JSON.valueToTree(List.of(3, 2, 1)));
    assertThat(outcomes.get(1).output()).isEqualTo(JSON.valueToTree(List.of()));
    assertThat(outcomes.get(2).error()).isEqualTo("ListCycleOrTooLong");
  }

  @Test
  void runsTreeCodeWithLevelOrderArrays() throws Exception {
    Problem p =
        problem(
            "class Solution {\n  TreeNode mirror(TreeNode root) {\n  }\n}",
            List.of(
                new TestCase(
                    List.of(Arrays.asList(4, 2, 7, 1, 3, 6, 9)), List.of(4, 7, 2, 9, 6, 3, 1)),
                new TestCase(List.of(Arrays.asList(1, null, 2)), List.of(1, 2)),
                new TestCase(List.of(List.of()), List.of())));
    String code =
        "class Solution {\n"
            + "  TreeNode mirror(TreeNode root) {\n"
            + "    if (root == null) return null;\n"
            + "    TreeNode left = mirror(root.left);\n"
            + "    root.left = mirror(root.right);\n"
            + "    root.right = left;\n"
            + "    return root;\n"
            + "  }\n"
            + "}";

    JavaHarness.Signature signature = JavaHarness.signature(p);
    assertThat(signature.treeArguments()).containsExactly(0);
    assertThat(signature.returnsTree()).isTrue();
    assertThat(JavaHarness.literal("TreeNode", JSON.valueToTree(Arrays.asList(1, null, 2))))
        .isEqualTo("TreeNode.of(new Integer[]{1, null, 2})");

    JavaHarness.Program program = JavaHarness.build(p, code);
    List<TestOutcome> outcomes =
        JavaHarness.outcomes(compileAndRun(program.source()), program.marker(), 3);

    assertThat(outcomes.get(0).output()).isEqualTo(JSON.valueToTree(List.of(4, 7, 2, 9, 6, 3, 1)));
    assertThat(outcomes.get(1).output()).isEqualTo(JSON.valueToTree(Arrays.asList(1, 2)));
    assertThat(outcomes.get(2).output()).isEqualTo(JSON.valueToTree(List.of()));
  }

  @Test
  void leavesTheListClassOutWhenNoListIsUsed() {
    Problem p = problem("class Solution {\n  int f(int[] a) {\n  }\n}", List.of());

    assertThat(JavaHarness.build(p, "class Solution {}").source()).doesNotContain("ListNode");
  }

  private static String compileAndRun(String source) throws Exception {
    Path dir = Files.createTempDirectory("harness");
    Files.writeString(dir.resolve("Main.java"), source);
    JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    int status = compiler.run(null, null, null, "-d", dir.toString(), dir + "/Main.java");
    assertThat(status).isZero();
    PrintStream original = System.out;
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    try (URLClassLoader loader = new URLClassLoader(new URL[] {dir.toUri().toURL()})) {
      System.setOut(new PrintStream(out, true, StandardCharsets.UTF_8));
      loader
          .loadClass("Main")
          .getMethod("main", String[].class)
          .invoke(null, (Object) new String[0]);
    } finally {
      System.setOut(original);
    }
    return out.toString(StandardCharsets.UTF_8);
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
