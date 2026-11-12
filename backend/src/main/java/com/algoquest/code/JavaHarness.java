package com.algoquest.code;

import com.algoquest.content.model.Problem;
import com.algoquest.content.model.TestCase;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Builds one Java program that runs the player's {@code Solution} on every hidden test and prints
 * each result as a JSON line after a random marker, so the player's own output is ignored (D-032).
 * The harness itself uses Java 8 syntax only, because the runner's JDK may be older than ours.
 */
public final class JavaHarness {

  private static final Pattern METHOD =
      Pattern.compile("(?m)^\\s*(?:public\\s+|static\\s+)*([\\w<>\\[\\]]+)\\s+(\\w+)\\s*\\(([^)]*)\\)");
  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final SecureRandom RANDOM = new SecureRandom();

  /** The program to run and the marker that starts each result line. */
  public record Program(String source, String marker) {}

  /** The method to call: its name and parameter types, read from the Java starter code. */
  public record Signature(String name, List<String> parameterTypes) {}

  private JavaHarness() {}

  public static Signature signature(Problem problem) {
    String starter = problem.starterCode() == null ? null : problem.starterCode().get("java");
    if (starter == null) {
      throw new IllegalArgumentException(problem.id() + " has no Java starter code");
    }
    Matcher m = METHOD.matcher(starter);
    while (m.find()) {
      if (m.group(1).equals("class") || m.group(1).equals("new")) {
        continue;
      }
      List<String> types = new ArrayList<>();
      for (String parameter : m.group(3).split(",")) {
        String trimmed = parameter.trim();
        if (!trimmed.isEmpty()) {
          types.add(trimmed.substring(0, trimmed.lastIndexOf(' ')).replace(" ", ""));
        }
      }
      return new Signature(m.group(2), types);
    }
    throw new IllegalArgumentException(problem.id() + ": no method in the Java starter code");
  }

  public static Program build(Problem problem, String code) {
    Signature signature = signature(problem);
    String marker = "@@" + HexFormat.of().formatHex(RANDOM.generateSeed(6));
    StringBuilder main = new StringBuilder();
    List<TestCase> tests = problem.tests();
    for (int i = 0; i < tests.size(); i++) {
      List<Object> input = tests.get(i).input();
      List<String> arguments = new ArrayList<>();
      for (int a = 0; a < signature.parameterTypes().size(); a++) {
        Object value = a < input.size() ? input.get(a) : null;
        arguments.add(literal(signature.parameterTypes().get(a), JSON.valueToTree(value)));
      }
      main.append("    run(")
          .append(i)
          .append(", new Call() { public Object call() throws Throwable { return new Solution().")
          .append(signature.name())
          .append('(')
          .append(String.join(", ", arguments))
          .append("); } });\n");
    }
    String source =
        "import java.util.*;\n\n"
            + "public class Main {\n"
            + "  interface Call { Object call() throws Throwable; }\n\n"
            + "  public static void main(String[] args) {\n"
            + main
            + "  }\n\n"
            + "  static void run(int i, Call c) {\n"
            + "    String line;\n"
            + "    try {\n"
            + "      line = json(c.call());\n"
            + "    } catch (Throwable e) {\n"
            + "      line = \"!\" + e.getClass().getSimpleName();\n"
            + "    }\n"
            + "    System.out.println(\""
            + marker
            + "\" + i + \" \" + line);\n"
            + "    System.out.flush();\n"
            + "  }\n\n"
            + "  static String json(Object o) {\n"
            + "    if (o == null) return \"null\";\n"
            + "    if (o instanceof String) return str((String) o);\n"
            + "    if (o instanceof Character) return str(String.valueOf(o));\n"
            + "    if (o instanceof Boolean || o instanceof Number) return String.valueOf(o);\n"
            + "    if (o.getClass().isArray()) {\n"
            + "      StringBuilder b = new StringBuilder(\"[\");\n"
            + "      int n = java.lang.reflect.Array.getLength(o);\n"
            + "      for (int k = 0; k < n; k++) {\n"
            + "        if (k > 0) b.append(',');\n"
            + "        b.append(json(java.lang.reflect.Array.get(o, k)));\n"
            + "      }\n"
            + "      return b.append(']').toString();\n"
            + "    }\n"
            + "    if (o instanceof Iterable) {\n"
            + "      StringBuilder b = new StringBuilder(\"[\");\n"
            + "      boolean first = true;\n"
            + "      for (Object x : (Iterable<?>) o) {\n"
            + "        if (!first) b.append(',');\n"
            + "        first = false;\n"
            + "        b.append(json(x));\n"
            + "      }\n"
            + "      return b.append(']').toString();\n"
            + "    }\n"
            + "    return str(o.toString());\n"
            + "  }\n\n"
            + "  static String str(String s) {\n"
            + "    StringBuilder b = new StringBuilder(\"\\\"\");\n"
            + "    for (char ch : s.toCharArray()) {\n"
            + "      if (ch == '\"' || ch == '\\\\') b.append('\\\\').append(ch);\n"
            + "      else if (ch < 0x20) b.append(String.format(\"\\\\u%04x\", (int) ch));\n"
            + "      else b.append(ch);\n"
            + "    }\n"
            + "    return b.append('\"').toString();\n"
            + "  }\n"
            + "}\n\n"
            + code
            + "\n";
    return new Program(source, marker);
  }

  /** Reads the result lines printed after the marker; a missing line means the test did not run. */
  public static List<TestOutcome> outcomes(String stdout, String marker, int tests) {
    List<TestOutcome> result = new ArrayList<>();
    for (int i = 0; i < tests; i++) {
      result.add(TestOutcome.failed("did not finish"));
    }
    if (stdout == null) {
      return result;
    }
    for (String line : stdout.split("\n")) {
      if (!line.startsWith(marker)) {
        continue;
      }
      String rest = line.substring(marker.length());
      int space = rest.indexOf(' ');
      if (space < 0) {
        continue;
      }
      int index;
      try {
        index = Integer.parseInt(rest.substring(0, space));
      } catch (NumberFormatException e) {
        continue;
      }
      if (index < 0 || index >= tests) {
        continue;
      }
      String value = rest.substring(space + 1).trim();
      if (value.startsWith("!")) {
        result.set(index, TestOutcome.failed(value.substring(1)));
      } else {
        try {
          result.set(index, TestOutcome.of(JSON.readTree(value)));
        } catch (RuntimeException e) {
          result.set(index, TestOutcome.failed("unreadable output"));
        }
      }
    }
    return result;
  }

  /** A Java expression of the given type for a JSON value. */
  static String literal(String type, JsonNode value) {
    if (value == null || value.isNull()) {
      return type.endsWith("[]") || !Character.isLowerCase(type.charAt(0))
          ? "(" + type + ") null"
          : "0";
    }
    if (type.endsWith("[]")) {
      String element = type.substring(0, type.length() - 2);
      List<String> items = new ArrayList<>();
      for (JsonNode item : value) {
        items.add(literal(element, item));
      }
      return "new " + type + "{" + String.join(", ", items) + "}";
    }
    switch (type) {
      case "String":
        return quote(value.asString());
      case "char":
      case "Character":
        return charLiteral(value.asString().isEmpty() ? ' ' : value.asString().charAt(0));
      case "long":
      case "Long":
        return value.asLong() + "L";
      case "double":
      case "Double":
        return Double.toString(value.asDouble());
      case "boolean":
      case "Boolean":
        return Boolean.toString(value.asBoolean());
      default:
        return Long.toString(value.asLong());
    }
  }

  private static String quote(String s) {
    StringBuilder b = new StringBuilder("\"");
    for (char ch : s.toCharArray()) {
      b.append(escape(ch, '"'));
    }
    return b.append('"').toString();
  }

  private static String charLiteral(char ch) {
    return "'" + escape(ch, '\'') + "'";
  }

  private static String escape(char ch, char quote) {
    if (ch == quote || ch == '\\') {
      return "\\" + ch;
    }
    if (ch < 0x20 || ch > 0x7e) {
      return String.format("\\u%04x", (int) ch);
    }
    return String.valueOf(ch);
  }
}
