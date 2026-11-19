package com.algoquest.content;

import com.algoquest.content.model.AnswerKey;
import com.algoquest.content.model.Example;
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
   * code, and visual structure must agree with canonical English.
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
        if (!java.util.Objects.equals(source.code(), target.code())) {
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
              || !java.util.Objects.equals(a.vars(), b.vars())
              || !java.util.Objects.equals(a.swap(), b.swap())
              || !java.util.Objects.equals(a.next(), b.next())) {
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
