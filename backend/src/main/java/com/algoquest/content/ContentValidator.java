package com.algoquest.content;

import com.algoquest.content.model.AnswerKey;
import com.algoquest.content.model.Example;
import com.algoquest.content.model.Lesson;
import com.algoquest.content.model.LevelInfo;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.QuickCheckQuestion;
import com.algoquest.content.model.Visual;
import com.algoquest.content.model.WalkthroughStep;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Pattern;

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

  private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
  private static final Set<String> DIFFICULTIES = Set.of("Easy", "Medium", "Hard");
  private static final Set<String> USES = Set.of("practice", "test", "hardTest");
  private static final Set<String> STATUSES = Set.of("ready", "comingSoon");

  private ContentValidator() {}

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
      if (level.phase() < 1 || level.phase() > 3) {
        problems.add(where + ": phase must be 1, 2, or 3");
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
    }
    List<WalkthroughStep> steps = lesson.walkthrough();
    if (steps != null) {
      if (steps.size() < 3) {
        problems.add(folder + "walkthrough.json: needs at least 3 steps");
      }
      for (int i = 0; i < steps.size(); i++) {
        if (blank(steps.get(i).title()) || blank(steps.get(i).body())) {
          problems.add(folder + "walkthrough.json, step " + (i + 1) + ": title and body required");
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
        QuickCheckQuestion q = questions.get(i);
        String where = folder + "quick-check.json, question " + (i + 1);
        if (blank(q.question()) || blank(q.explanation())) {
          problems.add(where + ": question and explanation required");
        }
        if (q.options() == null || q.options().size() < 2) {
          problems.add(where + ": needs at least 2 options");
        } else if (q.answer() < 0 || q.answer() >= q.options().size()) {
          problems.add(where + ": answer must be the index of one option");
        }
      }
    }
    return problems;
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
