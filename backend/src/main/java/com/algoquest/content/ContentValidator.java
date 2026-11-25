package com.algoquest.content;

import com.algoquest.content.model.AnswerKey;
import com.algoquest.content.model.Example;
import com.algoquest.content.model.Figure;
import com.algoquest.content.model.Lesson;
import com.algoquest.content.model.LevelInfo;
import com.algoquest.content.model.PatternChallenge;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.ProblemTranslation;
import com.algoquest.content.model.QuickCheckQuestion;
import com.algoquest.content.model.Visual;
import com.algoquest.content.model.WalkthroughStep;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/** Content rules from CONTENT-GUIDE.md. Each check returns problems as "file: message" lines. */
final class ContentValidator {

  static final List<String> LESSON_HEADINGS =
      List.of(
          "## Learning objectives",
          "## Problem hook",
          "## Intuition",
          "## When to use",
          "## Template code",
          "## Complexity",
          "## Common mistakes",
          "## Edge cases",
          "## Worked example");

  static final int MIN_TESTS = 8;
  static final int HINTS = 3;

  private static final JsonMapper FIGURE_JSON =
      JsonMapper.builder().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();
  private static final Pattern FIGURE_BLOCK =
      Pattern.compile("```figure\\n(.*?)\\n```", Pattern.DOTALL);
  private static final Pattern FIGURE_IMAGE =
      Pattern.compile("/lesson-images/[a-z0-9]+(-[a-z0-9]+)*\\.webp");
  static final int FIGURE_MIN_FRAMES = 2;
  static final int FIGURE_MAX_FRAMES = 6;
  static final int FIGURE_MAX_ITEMS = 8;
  private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
  private static final Set<String> DIFFICULTIES = Set.of("Easy", "Medium", "Hard");
  private static final Set<String> USES = Set.of("practice", "test", "hardTest");
  private static final Set<String> STATUSES = Set.of("ready", "comingSoon");

  private ContentValidator() {}

  /** The translation cannot modify hidden tests, solution data, option order or executable code. */
  static List<String> checkTranslatedProblem(
      String path, Problem canonical, ProblemTranslation translated) {
    List<String> issues = new ArrayList<>();
    if (!canonical.id().equals(translated.id())) {
      issues.add(path + ": id must match the canonical problem");
    }
    if (blank(translated.title()) || blank(translated.statement())) {
      issues.add(path + ": translated title and statement are required");
    }
    if (translated.exampleExplanations() == null
        || translated.exampleExplanations().size() != canonical.examples().size()) {
      issues.add(path + ": example count must match English");
    }
    if (translated.constraints() == null
        || translated.constraints().size() != canonical.constraints().size()) {
      issues.add(path + ": constraint count must match English");
    } else {
      for (int i = 0; i < canonical.constraints().size(); i++) {
        String original = canonical.constraints().get(i);
        String localized = translated.constraints().get(i);
        if (blank(localized)) {
          issues.add(path + ": constraint " + (i + 1) + " cannot be empty");
        } else if (!protectedTokens(original).equals(protectedTokens(localized))) {
          issues.add(
              path
                  + ": constraint "
                  + (i + 1)
                  + " must preserve numeric limits, comparisons and quoted values");
        }
      }
    }
    if (translated.hints() == null || translated.hints().size() != canonical.hints().size()) {
      issues.add(path + ": hint count must match English");
    } else {
      for (String hint : translated.hints()) {
        if (blank(hint)) issues.add(path + ": hints cannot be empty");
      }
    }
    return issues;
  }

  private static List<String> protectedTokens(String text) {
    java.util.regex.Matcher matcher =
        java.util.regex.Pattern.compile("<=|>=|==|\\d+(?:\\.\\d+)?(?:\\^\\d+)?|'[^']*'|[<>]")
            .matcher(text);
    List<String> tokens = new ArrayList<>();
    while (matcher.find()) tokens.add(matcher.group());
    return tokens;
  }

  static List<String> checkLevels(List<LevelInfo> levels) {
    List<String> problems = new ArrayList<>();
    Set<String> slugs = new HashSet<>();
    for (int i = 0; i < levels.size(); i++) {
      LevelInfo level = levels.get(i);
      String where = "levels.json, entry " + (i + 1);
      if (level.number() != i + 1) {
        problems.add(where + ": number must be " + (i + 1) + " (levels are numbered in order)");
      }
      if (level.slug() == null || !SLUG.matcher(level.slug()).matches()) {
        problems.add(where + ": slug must be lowercase words joined by '-'");
      } else if (!slugs.add(level.slug())) {
        problems.add(where + ": duplicate slug " + level.slug());
      }
      if (blank(level.title())) {
        problems.add(where + ": title is missing");
      }
      if (blank(level.summary())) {
        problems.add(where + ": summary is missing");
      }
      if (level.phase() < 1 || level.phase() > 4) {
        problems.add(where + ": phase must be 1, 2, 3, or 4");
      } else if (i > 0 && level.phase() < levels.get(i - 1).phase()) {
        problems.add(where + ": phase must not go back (levels are listed phase by phase)");
      }
    }
    return problems;
  }

  static List<String> checkLesson(String folder, Lesson lesson) {
    List<String> problems = new ArrayList<>();
    if (lesson.markdown() != null) {
      int from = 0;
      for (String heading : LESSON_HEADINGS) {
        int at = lesson.markdown().indexOf("\n" + heading + "\n", from);
        if (at < 0) {
          problems.add(folder + "lesson.md: missing or out-of-order heading '" + heading + "'");
        } else {
          from = at + 1;
        }
      }
      checkFigures(problems, folder + "lesson.md", lesson.markdown());
    }
    List<WalkthroughStep> steps = lesson.walkthrough();
    if (steps != null) {
      if (steps.size() < 3) {
        problems.add(folder + "walkthrough.json: needs at least 3 steps");
      }
      String codeInView = null;
      for (int i = 0; i < steps.size(); i++) {
        if (blank(steps.get(i).title()) || blank(steps.get(i).body())) {
          problems.add(folder + "walkthrough.json, step " + (i + 1) + ": title and body required");
        }
        if (!blank(steps.get(i).code())) {
          codeInView = steps.get(i).code();
        }
        List<Integer> lines = steps.get(i).lines();
        if (lines != null) {
          int count = codeInView == null ? 0 : codeInView.split("\n", -1).length;
          if (lines.size() != 2
              || lines.contains(null)
              || lines.get(0) < 1
              || lines.get(0) > lines.get(1)
              || lines.get(1) > count) {
            problems.add(
                folder
                    + "walkthrough.json, step "
                    + (i + 1)
                    + ": lines needs [first, last] inside the code of this or an earlier step");
          }
        }
        if (steps.get(i).visual() != null) {
          checkVisual(
              problems, folder + "walkthrough.json, step " + (i + 1), steps.get(i).visual());
        }
      }
    }
    List<QuickCheckQuestion> questions = lesson.quickCheck();
    if (questions != null) {
      if (questions.size() < 2 || questions.size() > 3) {
        problems.add(folder + "quick-check.json: needs 2 or 3 questions");
      }
      for (int i = 0; i < questions.size(); i++) {
        checkQuestion(problems, folder + "quick-check.json, question " + (i + 1), questions.get(i));
      }
    }
    if (lesson.intuition() != null) {
      checkQuestion(problems, folder + "intuition.json", lesson.intuition());
    }
    return problems;
  }

  /**
   * Localized prose may change, but section identities and grading-critical answer indices, counts,
   * code, and visual structure must agree with canonical English. Variable values and architecture
   * labels may be translated (D-079, D-080).
   */
  static List<String> checkLocalizedLesson(String folder, Lesson english, Lesson localized) {
    List<String> issues = new ArrayList<>();
    List<String> ids =
        List.of(
            "objectives",
            "problem-hook",
            "intuition",
            "when-to-use",
            "template-code",
            "complexity",
            "common-mistakes",
            "edge-cases",
            "worked-example");
    for (String id : ids) {
      if (localized.markdown() == null || !localized.markdown().contains("\n## [" + id + "] ")) {
        issues.add(folder + "lesson.md: missing section ID " + id);
      }
    }
    if (localized.quickCheck().size() != english.quickCheck().size()) {
      issues.add(folder + "quick-check.json: question count must match English");
    } else {
      for (int i = 0; i < english.quickCheck().size(); i++) {
        QuickCheckQuestion source = english.quickCheck().get(i);
        QuickCheckQuestion target = localized.quickCheck().get(i);
        checkQuestion(issues, folder + "quick-check.json, question " + (i + 1), target);
        if (source.answer() != target.answer()
            || source.options().size() != target.options().size()) {
          issues.add(
              folder
                  + "quick-check.json, question "
                  + (i + 1)
                  + ": answer index and option count must match English");
        }
      }
    }
    checkQuestion(issues, folder + "intuition.json", localized.intuition());
    if (english.intuition().answer() != localized.intuition().answer()
        || english.intuition().options().size() != localized.intuition().options().size()) {
      issues.add(folder + "intuition.json: answer index and options must match English");
    }
    if (localized.walkthrough().size() != english.walkthrough().size()) {
      issues.add(folder + "walkthrough.json: step count must match English");
    } else {
      for (int i = 0; i < english.walkthrough().size(); i++) {
        WalkthroughStep source = english.walkthrough().get(i);
        WalkthroughStep target = localized.walkthrough().get(i);
        if (!java.util.Objects.equals(source.code(), target.code())
            || !java.util.Objects.equals(source.lines(), target.lines())) {
          issues.add(
              folder
                  + "walkthrough.json, step "
                  + (i + 1)
                  + ": executable code must match English");
        }
        Visual a = source.visual();
        Visual b = target.visual();
        if ((a == null) != (b == null)) {
          issues.add(
              folder
                  + "walkthrough.json, step "
                  + (i + 1)
                  + ": visual structure must match English");
        } else if (a != null) {
          if (!java.util.Objects.equals(a.cells(), b.cells())
              || !java.util.Objects.equals(a.markers(), b.markers())
              || !sameVariableNames(a.vars(), b.vars())
              || !java.util.Objects.equals(a.swap(), b.swap())
              || !java.util.Objects.equals(a.next(), b.next())
              || a.drawsTree() != b.drawsTree()
              || !java.util.Objects.equals(a.edges(), b.edges())
              || a.drawsDirected() != b.drawsDirected()
              || !java.util.Objects.equals(a.visited(), b.visited())
              || !java.util.Objects.equals(a.positions(), b.positions())
              || !java.util.Objects.equals(a.activeEdges(), b.activeEdges())
              || !java.util.Objects.equals(a.queue(), b.queue())
              || !java.util.Objects.equals(a.rings(), b.rings())
              || !java.util.Objects.equals(a.window(), b.window())
              || !java.util.Objects.equals(a.stack(), b.stack())
              || !java.util.Objects.equals(a.calls(), b.calls())
              || !sameArchitecture(a.arch(), b.arch())
              || a.explores() != b.explores()
              || !java.util.Objects.equals(a.intervals(), b.intervals())
              || !java.util.Objects.equals(a.chosen(), b.chosen())
              || !java.util.Objects.equals(a.line(), b.line())
              || !java.util.Objects.equals(a.rows(), b.rows())
              || !java.util.Objects.equals(a.reads(), b.reads())
              || sizeOf(a.rowLabels()) != sizeOf(b.rowLabels())
              || sizeOf(a.columnLabels()) != sizeOf(b.columnLabels())
              || sizeOf(a.weights()) != sizeOf(b.weights())) {
            issues.add(
                folder
                    + "walkthrough.json, step "
                    + (i + 1)
                    + ": visual values and markers must match English");
          }
          Visual.Prediction pa = a.predict();
          Visual.Prediction pb = b.predict();
          if ((pa == null) != (pb == null)) {
            issues.add(
                folder
                    + "walkthrough.json, step "
                    + (i + 1)
                    + ": prediction presence must match English");
          } else if (pa != null) {
            if (pa.answer() != pb.answer()
                || pa.options().size() != pb.options().size()
                || !java.util.Objects.equals(pa.hides(), pb.hides())) {
              issues.add(
                  folder
                      + "walkthrough.json, step "
                      + (i + 1)
                      + ": prediction structure must match English");
            }
          }
        }
      }
    }
    return issues;
  }

  private static void checkGraph(List<String> problems, String where, Visual visual) {
    int n = visual.cells().size();
    if (visual.next() != null || visual.drawsTree()) {
      problems.add(where + ": a graph cannot also be a linked list or a tree");
    }
    if (n > Visual.MAX_GRAPH_VERTICES) {
      problems.add(where + ": a graph has at most " + Visual.MAX_GRAPH_VERTICES + " vertices");
    }
    Set<String> seen = new HashSet<>();
    for (List<Integer> edge : visual.edges()) {
      boolean valid =
          edge != null
              && edge.size() == 2
              && !edge.contains(null)
              && edge.get(0) >= 0
              && edge.get(0) < n
              && edge.get(1) >= 0
              && edge.get(1) < n
              && !edge.get(0).equals(edge.get(1));
      if (valid) {
        int a = edge.get(0);
        int b = edge.get(1);
        String key = visual.drawsDirected() ? a + ">" + b : Math.min(a, b) + "-" + Math.max(a, b);
        valid = seen.add(key);
      }
      if (!valid) {
        problems.add(
            where + ": each edge needs the indices of two different vertices, and no edge repeats");
        break;
      }
    }
    List<Integer> visited = visual.visited();
    if (visited != null
        && (visited.contains(null)
            || visited.stream().anyMatch(i -> i < 0 || i >= n)
            || new HashSet<>(visited).size() != visited.size())) {
      problems.add(where + ": visited lists distinct vertex indices");
    }
    if (visual.activeEdges() != null) {
      Set<String> edgeKeys = new HashSet<>();
      for (List<Integer> edge : visual.edges()) {
        if (edge != null && edge.size() == 2 && !edge.contains(null)) {
          edgeKeys.add(edge.get(0) + ">" + edge.get(1));
          if (!visual.drawsDirected()) {
            edgeKeys.add(edge.get(1) + ">" + edge.get(0));
          }
        }
      }
      boolean valid =
          visual.activeEdges().stream()
              .allMatch(
                  e ->
                      e != null
                          && e.size() == 2
                          && !e.contains(null)
                          && edgeKeys.contains(e.get(0) + ">" + e.get(1)));
      if (!valid) {
        problems.add(where + ": each active edge must be one of the edges");
      }
    }
    List<Integer> queue = visual.queue();
    if (queue != null && (queue.contains(null) || queue.stream().anyMatch(i -> i < 0 || i >= n))) {
      problems.add(where + ": queue lists vertex indices");
    }
    List<Integer> rings = visual.rings();
    if (rings != null
        && (rings.size() != n || rings.contains(null) || rings.stream().anyMatch(r -> r < -1))) {
      problems.add(where + ": rings needs one entry per vertex: a distance, or -1");
    }
    List<List<Integer>> positions = visual.positions();
    if (positions != null) {
      boolean valid = positions.size() == n;
      Set<List<Integer>> taken = new HashSet<>();
      for (int i = 0; valid && i < positions.size(); i++) {
        List<Integer> at = positions.get(i);
        valid =
            at != null
                && at.size() == 2
                && !at.contains(null)
                && at.get(0) >= 0
                && at.get(0) < Visual.GRAPH_COLUMNS
                && at.get(1) >= 0
                && at.get(1) < Visual.GRAPH_ROWS
                && taken.add(at);
      }
      if (!valid) {
        problems.add(
            where
                + ": positions needs one distinct [column, row] per vertex, columns 0 to "
                + (Visual.GRAPH_COLUMNS - 1)
                + " and rows 0 to "
                + (Visual.GRAPH_ROWS - 1));
      }
    }
  }

  private static void checkQuestion(List<String> problems, String where, QuickCheckQuestion q) {
    if (blank(q.question()) || blank(q.explanation())) {
      problems.add(where + ": question and explanation required");
    }
    if (q.options() == null || q.options().size() < 2) {
      problems.add(where + ": needs at least 2 options");
    } else if (q.answer() < 0 || q.answer() >= q.options().size()) {
      problems.add(where + ": answer must be the index of one option");
    }
  }

  private static int sizeOf(List<?> list) {
    return list == null ? -1 : list.size();
  }

  private static void checkTable(List<String> problems, String where, Visual visual) {
    if (!visual.drawsTable()) {
      if (visual.rowLabels() != null || visual.columnLabels() != null || visual.reads() != null) {
        problems.add(where + ": rowLabels, columnLabels and reads need rows");
      }
      return;
    }
    int n = visual.cells().size();
    int rows = visual.rows();
    boolean valid =
        rows > 0
            && n % rows == 0
            && visual.next() == null
            && !visual.drawsTree()
            && !visual.drawsGraph()
            && !visual.drawsIntervals()
            && (visual.window() == null || visual.window().isEmpty());
    int columns = rows > 0 ? n / rows : 0;
    if (!valid
        || (visual.rowLabels() != null
            && (visual.rowLabels().size() != rows || visual.rowLabels().contains(null)))
        || (visual.columnLabels() != null
            && (visual.columnLabels().size() != columns || visual.columnLabels().contains(null)))) {
      problems.add(
          where
              + ": a table needs rows dividing the cell count, labels matching rows and columns,"
              + " and the plain cell view");
    }
    List<Integer> reads = visual.reads();
    if (reads != null && (reads.contains(null) || reads.stream().anyMatch(i -> i < 0 || i >= n))) {
      problems.add(where + ": reads needs cell indexes");
    }
  }

  private static void checkIntervals(List<String> problems, String where, Visual visual) {
    if (!visual.drawsIntervals()) {
      if (visual.chosen() != null || visual.line() != null) {
        problems.add(where + ": chosen and line need intervals");
      }
      return;
    }
    int n = visual.cells().size();
    boolean valid =
        visual.intervals().size() == n
            && visual.next() == null
            && !visual.drawsTree()
            && !visual.drawsGraph()
            && (visual.window() == null || visual.window().isEmpty());
    for (List<Integer> interval : visual.intervals()) {
      valid =
          valid
              && interval != null
              && interval.size() == 2
              && !interval.contains(null)
              && interval.get(0) <= interval.get(1);
    }
    if (!valid) {
      problems.add(
          where
              + ": intervals need one [start, end] with start <= end per cell, on the cell view"
              + " without a window");
    }
    List<Integer> chosen = visual.chosen();
    if (chosen != null
        && (chosen.contains(null)
            || chosen.stream().anyMatch(i -> i < 0 || i >= n)
            || chosen.stream().distinct().count() != chosen.size())) {
      problems.add(where + ": chosen needs distinct interval indexes");
    }
  }

  /** Checks every {@code ```figure} block in a lesson (D-072). */
  static void checkFigures(List<String> problems, String where, String markdown) {
    Matcher block = FIGURE_BLOCK.matcher(markdown);
    int count = 0;
    while (block.find()) {
      count++;
      String at = where + ", figure " + count;
      Figure figure;
      try {
        figure = FIGURE_JSON.readValue(block.group(1), Figure.class);
      } catch (JacksonException e) {
        problems.add(at + ": not valid figure JSON");
        continue;
      }
      checkFigure(problems, at, figure);
    }
  }

  private static void checkFigure(List<String> problems, String at, Figure figure) {
    String kind = figure.kind() == null ? "" : figure.kind();
    if (kind.equals("image")) {
      if (figure.src() == null || !FIGURE_IMAGE.matcher(figure.src()).matches()) {
        problems.add(at + ": image src must be /lesson-images/<slug>.webp");
      }
      if (blank(figure.alt())) {
        problems.add(at + ": image needs alt text");
      }
      if (figure.frames() != null) {
        problems.add(at + ": an image has no frames");
      }
      return;
    }
    if (!Set.of("stack", "queue", "visual").contains(kind)) {
      problems.add(at + ": kind must be stack, queue, visual, or image");
      return;
    }
    if (figure.src() != null || figure.alt() != null) {
      problems.add(at + ": only an image has src and alt");
    }
    List<Figure.Frame> frames = figure.frames();
    if (frames == null || frames.size() < FIGURE_MIN_FRAMES || frames.size() > FIGURE_MAX_FRAMES) {
      problems.add(at + ": needs " + FIGURE_MIN_FRAMES + " to " + FIGURE_MAX_FRAMES + " frames");
      return;
    }
    for (int i = 0; i < frames.size(); i++) {
      Figure.Frame frame = frames.get(i);
      String here = at + ", frame " + (i + 1);
      if (blank(frame.op())) {
        problems.add(here + ": op is missing");
      }
      if (kind.equals("visual")) {
        if (frame.visual() == null) {
          problems.add(here + ": a visual frame needs a visual");
        } else {
          checkVisual(problems, here, frame.visual());
        }
        if (frame.items() != null || frame.out() != null) {
          problems.add(here + ": a visual frame uses visual, not items or out");
        }
      } else {
        if (frame.items() == null || frame.items().size() > FIGURE_MAX_ITEMS) {
          problems.add(here + ": items must list at most " + FIGURE_MAX_ITEMS + " values");
        } else if (frame.items().stream().anyMatch(ContentValidator::blank)) {
          problems.add(here + ": items must not be blank");
        }
        if (frame.visual() != null) {
          problems.add(here + ": only a visual frame has a visual");
        }
      }
    }
  }

  private static final Set<String> CALL_STATES = Set.of("active", "waiting", "done");

  /** The recursion staircase (D-078): a few calls, each with text, a depth and a known state. */
  private static void checkCalls(List<String> problems, String where, List<Visual.Call> calls) {
    if (calls == null) {
      return;
    }
    if (calls.isEmpty() || calls.size() > Visual.MAX_CALLS || calls.contains(null)) {
      problems.add(where + ": calls needs 1 to " + Visual.MAX_CALLS + " calls");
      return;
    }
    long active = 0;
    for (Visual.Call call : calls) {
      if (blank(call.text())
          || call.depth() < 0
          || call.depth() > Visual.MAX_CALL_DEPTH
          || !CALL_STATES.contains(call.state())) {
        problems.add(
            where
                + ": each call needs text, a depth from 0 to "
                + Visual.MAX_CALL_DEPTH
                + " and a state: active, waiting or done");
        return;
      }
      if (call.state().equals("active")) {
        active++;
      }
    }
    if (active > 1) {
      problems.add(where + ": at most one call can be active");
    }
  }

  /**
   * Translations keep every variable, in the same order and with the same name (predictions hide
   * variables by name), but may translate the values (D-080).
   */
  private static boolean sameVariableNames(List<Visual.Variable> a, List<Visual.Variable> b) {
    if (a == null || b == null) {
      return a == b;
    }
    if (a.size() != b.size()) {
      return false;
    }
    for (int i = 0; i < a.size(); i++) {
      Visual.Variable x = a.get(i);
      Visual.Variable y = b.get(i);
      if (x == null
          || y == null
          || !java.util.Objects.equals(x.name(), y.name())
          || blank(y.value())) {
        return false;
      }
    }
    return true;
  }

  /** Translations may change component labels and notes only. */
  private static boolean sameArchitecture(Visual.Architecture a, Visual.Architecture b) {
    if (a == null || b == null) {
      return a == b;
    }
    if (a.nodes() == null || b.nodes() == null || a.nodes().size() != b.nodes().size()) {
      return a.nodes() == b.nodes();
    }
    for (int i = 0; i < a.nodes().size(); i++) {
      Visual.Component x = a.nodes().get(i);
      Visual.Component y = b.nodes().get(i);
      if (x == null
          || y == null
          || !java.util.Objects.equals(x.kind(), y.kind())
          || x.x() != y.x()
          || x.y() != y.y()
          || !java.util.Objects.equals(x.state(), y.state())) {
        return false;
      }
    }
    return java.util.Objects.equals(a.links(), b.links())
        && java.util.Objects.equals(a.path(), b.path())
        && a.drops() == b.drops()
        && java.util.Objects.equals(a.flows(), b.flows());
  }

  private static final Set<String> COMPONENT_STATES = Set.of("hot", "down");

  private static void checkArchitecture(List<String> problems, String where, Visual visual) {
    Visual.Architecture arch = visual.arch();
    if (arch == null) {
      return;
    }
    if (!visual.cells().isEmpty()
        || visual.drawsGraph()
        || visual.drawsTree()
        || visual.next() != null
        || visual.drawsIntervals()
        || visual.drawsTable()) {
      problems.add(where + ": an architecture diagram uses cells [] and no other drawing");
    }
    List<Visual.Component> nodes = arch.nodes() == null ? List.of() : arch.nodes();
    if (nodes.isEmpty() || nodes.size() > Visual.MAX_COMPONENTS || nodes.contains(null)) {
      problems.add(where + ": arch needs 1 to " + Visual.MAX_COMPONENTS + " components");
      return;
    }
    Set<String> places = new HashSet<>();
    for (Visual.Component node : nodes) {
      if (!Visual.COMPONENT_KINDS.contains(node.kind())
          || blank(node.label())
          || node.label().length() > Visual.MAX_COMPONENT_LABEL
          || (node.state() != null && !COMPONENT_STATES.contains(node.state()))) {
        problems.add(
            where
                + ": each component needs a known kind, a label of at most "
                + Visual.MAX_COMPONENT_LABEL
                + " characters, and a state of hot, down or none");
        return;
      }
      if (node.note() != null
          && (blank(node.note()) || node.note().length() > Visual.MAX_COMPONENT_NOTE)) {
        problems.add(
            where + ": a component note needs 1 to " + Visual.MAX_COMPONENT_NOTE + " characters");
        return;
      }
      if (node.x() < 0
          || node.x() >= Visual.ARCH_COLUMNS
          || node.y() < 0
          || node.y() >= Visual.ARCH_ROWS
          || !places.add(node.x() + "," + node.y())) {
        problems.add(
            where
                + ": component places are columns 0 to "
                + (Visual.ARCH_COLUMNS - 1)
                + " and rows 0 to "
                + (Visual.ARCH_ROWS - 1)
                + ", one component per place");
        return;
      }
    }
    int n = nodes.size();
    Set<String> links = new HashSet<>();
    for (List<Integer> link : arch.links() == null ? List.<List<Integer>>of() : arch.links()) {
      boolean valid =
          link != null
              && link.size() == 2
              && !link.contains(null)
              && link.get(0) >= 0
              && link.get(0) < n
              && link.get(1) >= 0
              && link.get(1) < n
              && !link.get(0).equals(link.get(1))
              && links.add(
                  Math.min(link.get(0), link.get(1)) + "-" + Math.max(link.get(0), link.get(1)));
      if (!valid) {
        problems.add(
            where
                + ": each link needs the indices of two different components, and no link repeats");
        return;
      }
    }
    List<Integer> path = arch.path();
    if (path != null) {
      if (!followsLinks(path, links)) {
        problems.add(where + ": path needs two or more components, each step along a link");
      }
    } else if (arch.drops()) {
      problems.add(where + ": drop needs a path");
    }
    List<Visual.Flow> flows = arch.flows();
    if (flows != null) {
      if (flows.size() > Visual.MAX_FLOWS || flows.contains(null)) {
        problems.add(where + ": arch has at most " + Visual.MAX_FLOWS + " extra flows");
        return;
      }
      for (Visual.Flow flow : flows) {
        if (flow.path() == null || !followsLinks(flow.path(), links)) {
          problems.add(
              where + ": each flow path needs two or more components, each step along a link");
          return;
        }
      }
    }
  }

  /** A path visits two or more components, and each step follows one of the given links. */
  private static boolean followsLinks(List<Integer> path, Set<String> links) {
    boolean valid = path.size() >= 2 && !path.contains(null);
    for (int i = 0; valid && i + 1 < path.size(); i++) {
      int a = path.get(i);
      int b = path.get(i + 1);
      valid = links.contains(Math.min(a, b) + "-" + Math.max(a, b));
    }
    return valid;
  }

  private static void checkVisual(List<String> problems, String where, Visual visual) {
    if (visual.cells() == null) {
      problems.add(where + ": visual needs cells (use [] for none)");
      return;
    }
    if (visual.markers() != null) {
      for (Visual.Marker marker : visual.markers()) {
        if (marker.index() < 0
            || marker.index() >= visual.cells().size()
            || blank(marker.label())) {
          problems.add(where + ": each marker needs a label and the index of a cell");
        }
      }
    }
    List<Integer> swap = visual.swap();
    if (swap != null
        && (swap.size() != 2
            || swap.contains(null)
            || swap.get(0).equals(swap.get(1))
            || swap.stream().anyMatch(i -> i < 0 || i >= visual.cells().size()))) {
      problems.add(where + ": swap needs the indices of two different cells");
    }
    if (visual.drawsTree()) {
      List<String> cells = visual.cells();
      boolean valid = cells.size() <= Visual.MAX_TREE_CELLS;
      for (int i = 1; valid && i < cells.size(); i++) {
        valid = blank(cells.get(i)) || !blank(cells.get((i - 1) / 2));
      }
      if (!valid) {
        problems.add(
            where
                + ": a tree has at most "
                + Visual.MAX_TREE_CELLS
                + " cells, and every node needs its parent at (i - 1) / 2");
      }
    }
    if (visual.drawsGraph()) {
      checkGraph(problems, where, visual);
    } else if (visual.directed() != null
        || visual.visited() != null
        || visual.positions() != null
        || visual.activeEdges() != null
        || visual.queue() != null
        || visual.rings() != null
        || visual.explore() != null) {
      problems.add(
          where
              + ": directed, visited, positions, activeEdges, queue, rings and explore need"
              + " edges");
    }
    if (visual.stack() != null && visual.stack().contains(null)) {
      problems.add(where + ": stack items must be text");
    }
    checkCalls(problems, where, visual.calls());
    checkArchitecture(problems, where, visual);
    checkIntervals(problems, where, visual);
    checkTable(problems, where, visual);
    if (visual.weights() != null
        && (visual.edges() == null
            || visual.weights().size() != visual.edges().size()
            || visual.weights().contains(null))) {
      problems.add(where + ": weights need one label per edge");
    }
    List<Integer> window = visual.window();
    if (window != null && !window.isEmpty()) {
      boolean valid =
          window.size() == 2
              && !window.contains(null)
              && window.get(0) >= 0
              && window.get(0) <= window.get(1)
              && window.get(1) < visual.cells().size()
              && visual.next() == null
              && !visual.drawsTree()
              && !visual.drawsGraph();
      if (!valid) {
        problems.add(
            where
                + ": window needs [start, end] inside the cells with start <= end, on the cell"
                + " view only");
      }
    }
    List<Integer> next = visual.next();
    if (next != null) {
      boolean valid = next.size() == visual.cells().size();
      for (int i = 0; valid && i < next.size(); i++) {
        Integer target = next.get(i);
        valid = target != null && target >= -1 && target < next.size() && target != i;
      }
      if (!valid) {
        problems.add(
            where + ": next needs one entry per cell: another cell's index, or -1 for null");
      }
    }
    Set<String> names = new HashSet<>();
    if (visual.vars() != null) {
      for (Visual.Variable variable : visual.vars()) {
        if (blank(variable.name()) || variable.value() == null) {
          problems.add(where + ": each variable needs a name and a value");
        } else {
          names.add(variable.name());
        }
      }
    }
    if (visual.next() != null) {
      names.add("next");
    }
    if (visual.stack() != null) {
      names.add("stack");
    }
    if (visual.markers() != null && !visual.markers().isEmpty()) {
      names.add("cell");
    }
    Visual.Prediction predict = visual.predict();
    if (predict != null) {
      if (blank(predict.question()) || blank(predict.explanation())) {
        problems.add(where + ": prediction needs a question and an explanation");
      }
      if (predict.options() == null || predict.options().size() < 2) {
        problems.add(where + ": prediction needs at least 2 options");
      } else if (predict.answer() < 0 || predict.answer() >= predict.options().size()) {
        problems.add(where + ": prediction answer must be the index of one option");
      }
      if (predict.hides() != null && !names.containsAll(predict.hides())) {
        problems.add(where + ": prediction hides a variable the step does not have");
      }
    }
  }

  private static final Set<String> APPROACH_LABELS = Set.of("best", "valid", "unsuitable");
  private static final Pattern PATTERN_ID = Pattern.compile("P(\\d+)-[a-z0-9]+(-[a-z0-9]+)*");

  /** Pattern challenges (D-057): one best approach, three or four choices, every field filled. */
  static List<String> checkPatterns(String folder, int level, List<PatternChallenge> challenges) {
    List<String> problems = new ArrayList<>();
    Set<String> ids = new HashSet<>();
    for (int i = 0; i < challenges.size(); i++) {
      PatternChallenge c = challenges.get(i);
      String where = folder + "patterns.json, challenge " + (i + 1);
      var id = c.id() == null ? null : PATTERN_ID.matcher(c.id());
      if (id == null || !id.matches() || Integer.parseInt(id.group(1)) != level) {
        problems.add(where + ": id must look like P" + level + "-some-name");
      } else if (!ids.add(c.id())) {
        problems.add(where + ": id " + c.id() + " is used twice");
      }
      if (c.level() != level) {
        problems.add(where + ": level must be " + level);
      }
      if (blank(c.title()) || blank(c.statement())) {
        problems.add(where + ": title and statement required");
      }
      if (c.examples() == null || c.examples().isEmpty()) {
        problems.add(where + ": at least one example required");
      }
      List<PatternChallenge.Approach> approaches =
          c.approaches() == null ? List.of() : c.approaches();
      if (approaches.size() < 3 || approaches.size() > 4) {
        problems.add(where + ": needs 3 or 4 approaches");
      }
      Set<String> approachIds = new HashSet<>();
      long best = 0;
      for (PatternChallenge.Approach a : approaches) {
        String at = where + ", approach " + a.id();
        if (blank(a.id()) || !approachIds.add(a.id())) {
          problems.add(at + ": approach ids must be present and different");
        }
        if (!APPROACH_LABELS.contains(a.label())) {
          problems.add(at + ": label must be best, valid, or unsuitable");
        }
        if ("best".equals(a.label())) {
          best++;
        }
        if (blank(a.name())
            || blank(a.hint())
            || blank(a.time())
            || blank(a.space())
            || blank(a.why())) {
          problems.add(at + ": name, hint, time, space, and why required");
        }
      }
      if (best != 1) {
        problems.add(where + ": exactly one approach must be labelled best");
      }
    }
    return problems;
  }

  static List<String> checkProblem(String path, int level, Problem p) {
    List<String> problems = new ArrayList<>();
    String expectedFile = "problems/" + p.id() + ".json";
    if (p.id() == null || !p.id().startsWith("L" + level + "-") || !path.endsWith(expectedFile)) {
      problems.add(path + ": id must start with L" + level + "- and match the file name");
    }
    if (p.level() != level) {
      problems.add(path + ": level must be " + level + " (the folder it is in)");
    }
    requireOneOf(problems, path, "difficulty", p.difficulty(), DIFFICULTIES);
    requireOneOf(problems, path, "use", p.use(), USES);
    requireOneOf(problems, path, "status", p.status(), STATUSES);
    if (blank(p.title())) {
      problems.add(path + ": title is missing");
    }
    if (p.order() != null && p.order() < 1) {
      problems.add(path + ": order must be 1 or more");
    }
    if ("comingSoon".equals(p.status())) {
      boolean hasMore =
          p.statement() != null
              || p.examples() != null
              || p.answerKey() != null
              || p.hints() != null
              || p.tests() != null;
      if (hasMore) {
        problems.add(
            path + ": a comingSoon placeholder has only id, level, difficulty, use, title");
      }
    } else if ("ready".equals(p.status())) {
      checkReady(problems, path, p);
    }
    return problems;
  }

  private static void checkReady(List<String> problems, String path, Problem p) {
    if (blank(p.statement())) {
      problems.add(path + ": statement is missing");
    }
    if (p.examples() == null || p.examples().isEmpty()) {
      problems.add(path + ": needs at least one example");
    } else {
      for (Example example : p.examples()) {
        if (blank(example.input()) || blank(example.output())) {
          problems.add(path + ": every example needs input and output");
        }
      }
    }
    if (p.constraints() == null || p.constraints().isEmpty()) {
      problems.add(path + ": constraints are missing");
    }
    AnswerKey key = p.answerKey();
    if (key == null
        || blank(key.pattern())
        || empty(key.keyPoints())
        || blank(key.timeComplexity())
        || blank(key.spaceComplexity())
        || empty(key.edgeCases())) {
      problems.add(path + ": answerKey needs pattern, keyPoints, complexities, edgeCases");
    }
    List<String> hints = p.hints();
    if (hints == null || hints.size() != HINTS || hints.stream().anyMatch(h -> blank(h))) {
      problems.add(path + ": needs exactly " + HINTS + " hints");
    }
    if (p.tests() == null || p.tests().size() < MIN_TESTS) {
      problems.add(path + ": needs at least " + MIN_TESTS + " hidden tests");
    } else if (p.tests().stream().anyMatch(t -> t.input() == null)) {
      problems.add(path + ": every test needs an input list");
    }
    Map<String, String> starter = p.starterCode();
    if (starter == null || blank(starter.get("javascript")) || blank(starter.get("java"))) {
      problems.add(path + ": starterCode needs javascript and java");
    }
  }

  private static void requireOneOf(
      List<String> problems, String path, String field, String value, Set<String> allowed) {
    if (value == null || !allowed.contains(value)) {
      problems.add(path + ": " + field + " must be one of " + new TreeSet<>(allowed));
    }
  }

  private static boolean blank(String value) {
    return value == null || value.isBlank();
  }

  private static boolean empty(List<?> values) {
    return values == null || values.isEmpty();
  }
}
