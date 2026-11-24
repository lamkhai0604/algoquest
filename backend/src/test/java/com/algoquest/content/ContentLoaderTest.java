package com.algoquest.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.PatternChallenge;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.ProblemTranslation;
import com.algoquest.content.model.Visual;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

class ContentLoaderTest {

  private static final PathMatchingResourcePatternResolver RESOLVER =
      new PathMatchingResourcePatternResolver();

  private static final String FEW_TESTS =
      """
      {"id": "L1-few-tests", "level": 1, "difficulty": "Easy", "use": "practice",
       "status": "ready", "title": "Few Tests", "statement": "Return x.",
       "examples": [{"input": "1", "output": "1"}], "constraints": ["x >= 0"],
       "answerKey": {"pattern": "Identity", "keyPoints": ["Return it"],
         "timeComplexity": "O(1)", "spaceComplexity": "O(1)", "edgeCases": ["Zero"]},
       "hints": ["a", "b", "c"],
       "tests": [{"input": [1], "expected": 1}, {"input": [2], "expected": 2}],
       "starterCode": {"javascript": "f", "java": "g"}}
      """;

  @TempDir Path dir;

  private Path level;

  @BeforeEach
  void copyValidFixture() throws Exception {
    Path source = Path.of(getClass().getResource("/content-fixtures/valid").toURI());
    try (Stream<Path> files = Files.walk(source)) {
      for (Path file : files.toList()) {
        Path target = dir.resolve(source.relativize(file).toString());
        if (Files.isDirectory(file)) {
          Files.createDirectories(target);
        } else {
          Files.copy(file, target);
        }
      }
    }
    level = dir.resolve("levels/1-basics");
  }

  private Map<Integer, LevelContent> load() {
    return ContentLoader.load(RESOLVER, dir.toUri().toString());
  }

  private List<String> problemsAfterLoad() {
    return catchThrowableOfType(ContentException.class, this::load).problems();
  }

  private void replace(Path file, String from, String to) throws IOException {
    String text = Files.readString(file);
    assertThat(text).contains(from);
    Files.writeString(file, text.replace(from, to));
  }

  @Test
  void validContentLoads() {
    Map<Integer, LevelContent> levels = load();

    assertThat(levels).hasSize(2);
    assertThat(levels.get(1).available()).isTrue();
    assertThat(levels.get(1).problems()).hasSize(6);
    assertThat(levels.get(1).lesson().walkthrough()).hasSize(6);
    assertThat(levels.get(1).info().phase()).isEqualTo(1);
    assertThat(levels.get(1).lesson().walkthrough().get(1).visual().predict().hides())
        .containsExactly("best");
    assertThat(levels.get(1).lesson().walkthrough().get(1).visual().swap()).containsExactly(0, 2);
    assertThat(levels.get(1).lesson().walkthrough().get(1).visual().window()).containsExactly(0, 1);
    assertThat(levels.get(1).lesson().walkthrough().get(2).visual().next())
        .containsExactly(1, 2, -1);
    assertThat(levels.get(1).lesson().walkthrough().get(0).visual().drawsTree()).isTrue();
    assertThat(levels.get(1).lesson().walkthrough().get(1).visual().drawsTree()).isFalse();
    Visual graph = levels.get(1).lesson().walkthrough().get(3).visual();
    assertThat(graph.drawsGraph()).isTrue();
    assertThat(graph.drawsDirected()).isFalse();
    assertThat(graph.edges()).hasSize(3);
    assertThat(graph.visited()).containsExactly(0);
    assertThat(graph.positions().get(3)).containsExactly(2, 2);
    assertThat(graph.activeEdges()).hasSize(1);
    assertThat(graph.queue()).containsExactly(1, 2);
    assertThat(graph.rings()).containsExactly(0, 1, 1, -1);
    assertThat(graph.explores()).isTrue();
    assertThat(levels.get(1).lesson().walkthrough().get(1).visual().stack())
        .containsExactly("3", "9");
    Visual meetings = levels.get(1).lesson().walkthrough().get(4).visual();
    assertThat(meetings.drawsIntervals()).isTrue();
    assertThat(meetings.intervals().get(1)).containsExactly(2, 3);
    assertThat(meetings.chosen()).containsExactly(1);
    assertThat(meetings.line()).isEqualTo(3);
    assertThat(graph.drawsIntervals()).isFalse();
    Visual table = levels.get(1).lesson().walkthrough().get(5).visual();
    assertThat(table.drawsTable()).isTrue();
    assertThat(table.rows()).isEqualTo(2);
    assertThat(table.columnLabels()).containsExactly("", "a", "b");
    assertThat(table.reads()).containsExactly(1, 3, 4);
    assertThat(meetings.drawsTable()).isFalse();
    assertThat(graph.weights()).hasSize(graph.edges().size()).startsWith("2");
    assertThat(meetings.weights()).isNull();
    assertThat(levels.get(1).lesson().intuition().answer()).isEqualTo(1);
    PatternChallenge challenge = levels.get(1).patterns().getFirst();
    assertThat(challenge.best().id()).isEqualTo("hash");
    assertThat(challenge.approach("nested").correct()).isTrue();
    assertThat(challenge.approach("pass").correct()).isFalse();
    assertThat(levels.get(2).available()).isFalse();
  }

  @Test
  void vietnameseProblemTextsPreserveExamplesAndHiddenScoringData() {
    Map<Integer, LevelContent> canonical = ContentLoader.load(RESOLVER, "classpath:content/");
    Map<String, ProblemTranslation> localized =
        ContentLoader.loadVietnameseProblems(RESOLVER, "classpath:content/", canonical);

    assertThat(localized).hasSize(9).containsKeys("L1-max-temperature", "L1-count-peaks");
    assertThat(localized).doesNotContainKey("L1-moving-median");

    for (Problem problem : canonical.get(1).problems()) {
      ProblemTranslation translation = localized.get(problem.id());
      if (translation == null) continue;
      var displayed = ContentViews.ProblemView.of(problem, translation);
      assertThat(displayed.id()).isEqualTo(problem.id());
      assertThat(displayed.difficulty()).isEqualTo(problem.difficulty());
      assertThat(displayed.starterCode()).isEqualTo(problem.starterCode());
      assertThat(displayed.hintCount()).isEqualTo(problem.hints().size());
      assertThat(displayed.examples()).hasSameSizeAs(problem.examples());
      for (int i = 0; i < problem.examples().size(); i++) {
        assertThat(displayed.examples().get(i).input())
            .isEqualTo(problem.examples().get(i).input());
        assertThat(displayed.examples().get(i).output())
            .isEqualTo(problem.examples().get(i).output());
      }
    }
    assertThat(localized.get("L1-max-temperature").title()).isEqualTo("Nhiệt độ cao nhất");
  }

  @Test
  void localizedConstraintsCannotChangeNumericLimits() {
    Map<Integer, LevelContent> canonical = ContentLoader.load(RESOLVER, "classpath:content/");
    Map<String, ProblemTranslation> localized =
        ContentLoader.loadVietnameseProblems(RESOLVER, "classpath:content/", canonical);
    Problem original =
        canonical.get(1).problems().stream()
            .filter(problem -> problem.id().equals("L1-max-temperature"))
            .findFirst()
            .orElseThrow();
    ProblemTranslation valid = localized.get(original.id());
    List<String> changed = new java.util.ArrayList<>(valid.constraints());
    changed.set(0, changed.get(0).replace("10^5", "10^6"));
    ProblemTranslation tampered =
        new ProblemTranslation(
            valid.id(),
            valid.title(),
            valid.statement(),
            valid.exampleExplanations(),
            changed,
            valid.hints());

    assertThat(ContentValidator.checkTranslatedProblem("vi/problem.json", original, tampered))
        .anyMatch(message -> message.contains("numeric limits"));
  }

  @Test
  void theRealContentFolderIsValid() {
    assertThatCode(() -> ContentLoader.load(RESOLVER, "classpath:content/"))
        .doesNotThrowAnyException();
  }

  @Test
  void vietnameseLevelOneLoadsWithCanonicalAnswerIndices() {
    Map<Integer, LevelContent> canonical = ContentLoader.load(RESOLVER, "classpath:content/");
    var localized = ContentLoader.loadVietnameseLessons(RESOLVER, "classpath:content/", canonical);

    assertThat(localized).containsKey(1);
    assertThat(localized.get(1).markdown()).contains("## [problem-hook] Tình huống mở đầu");
    assertThat(localized.get(1).quickCheck()).hasSameSizeAs(canonical.get(1).lesson().quickCheck());
    for (int i = 0; i < localized.get(1).quickCheck().size(); i++) {
      assertThat(localized.get(1).quickCheck().get(i).answer())
          .isEqualTo(canonical.get(1).lesson().quickCheck().get(i).answer());
    }
    assertThat(localized.get(1).walkthrough().get(0).visual().cells())
        .isEqualTo(canonical.get(1).lesson().walkthrough().get(0).visual().cells());
    assertThat(localized).doesNotContainKey(99);
  }

  @Test
  void missingLocaleFilesFallBackToCanonicalEnglish() {
    Map<Integer, LevelContent> canonical = load();
    var localized =
        ContentLoader.loadVietnameseLessons(RESOLVER, dir.toUri().toString(), canonical);
    assertThat(localized).isEmpty();
  }

  @Test
  void everyProblemIsReportedWithItsFile() throws IOException {
    replace(level.resolve("lesson.md"), "## Worked example", "## Example");
    replace(level.resolve("quick-check.json"), "\"answer\": 1", "\"answer\": 5");
    replace(level.resolve("intuition.json"), "\"answer\": 1", "\"answer\": 4");
    replace(level.resolve("problems/L1-pair-max.json"), "\"answerKey\"", "\"answerkey\"");
    Path maxValue = level.resolve("problems/L1-max-value.json");
    Files.writeString(level.resolve("problems/L1-renamed.json"), Files.readString(maxValue));
    Files.createDirectories(dir.resolve("levels/9-stray"));
    Files.writeString(dir.resolve("levels/9-stray/notes.md"), "stray");

    List<String> problems = problemsAfterLoad();

    assertThat(problems)
        .anyMatch(p -> p.contains("lesson.md") && p.contains("Worked example"))
        .anyMatch(p -> p.contains("quick-check.json, question 1") && p.contains("index"))
        .anyMatch(p -> p.contains("intuition.json") && p.contains("index"))
        .anyMatch(p -> p.contains("L1-pair-max.json") && p.contains("answerkey"))
        .anyMatch(p -> p.contains("L1-renamed.json") && p.contains("file name"))
        .anyMatch(p -> p.contains("9-stray/notes.md"));
  }

  @Test
  void problemRulesAreChecked() throws IOException {
    Path maxValue = level.resolve("problems/L1-max-value.json");
    replace(maxValue, "\"SECRET-HINT-3\"", "\"\"");
    replace(maxValue, "\"java\": \"class Solution {\\n}\"", "\"kotlin\": \"x\"");
    replace(level.resolve("problems/L1-pair-max.json"), "\"Medium\"", "\"Tricky\"");
    Path later = level.resolve("problems/L1-hard-later.json");
    replace(later, "\"title\": \"Hard Later\"", "\"title\": \"Hard Later\", \"statement\": \"x\"");
    Files.writeString(level.resolve("problems/L1-few-tests.json"), FEW_TESTS);

    List<String> problems = problemsAfterLoad();

    assertThat(problems)
        .anyMatch(p -> p.contains("L1-max-value.json") && p.contains("3 hints"))
        .anyMatch(p -> p.contains("L1-max-value.json") && p.contains("starterCode"))
        .anyMatch(p -> p.contains("L1-pair-max.json") && p.contains("difficulty"))
        .anyMatch(p -> p.contains("L1-hard-later.json") && p.contains("comingSoon"))
        .anyMatch(p -> p.contains("L1-few-tests.json") && p.contains("at least 8 hidden tests"));
  }

  @Test
  void levelListRulesAreChecked() throws IOException {
    replace(dir.resolve("levels.json"), "\"number\": 2", "\"number\": 3");
    replace(dir.resolve("levels.json"), "\"slug\": \"later\"", "\"slug\": \"Later Level\"");

    List<String> problems = problemsAfterLoad();

    assertThat(problems)
        .anyMatch(p -> p.contains("entry 2") && p.contains("number must be 2"))
        .anyMatch(p -> p.contains("entry 2") && p.contains("slug"));
  }

  @Test
  void patternChallengesNeedOneBestApproachAndCompleteFields() throws IOException {
    Path patterns = level.resolve("patterns.json");
    replace(patterns, "\"label\": \"valid\"", "\"label\": \"best\"");
    replace(patterns, "\"id\": \"P1-repeat\"", "\"id\": \"P2-repeat\"");
    replace(patterns, "\"why\": \"Cannot remember every value.\"", "\"why\": \"\"");

    assertThat(problemsAfterLoad())
        .anyMatch(p -> p.contains("patterns.json") && p.contains("exactly one approach"))
        .anyMatch(p -> p.contains("patterns.json") && p.contains("P1-some-name"))
        .anyMatch(p -> p.contains("approach pass") && p.contains("required"));
  }

  @Test
  void phasesMustBeValidAndInOrder() throws IOException {
    replace(dir.resolve("levels.json"), "\"phase\": 1", "\"phase\": 3");

    List<String> problems = problemsAfterLoad();

    assertThat(problems)
        .anyMatch(p -> p.contains("entry 2") && p.contains("phase must not go back"));
  }

  @Test
  void visualRulesAreChecked() throws IOException {
    Path walkthrough = level.resolve("walkthrough.json");
    replace(walkthrough, "\"index\": 1", "\"index\": 7");
    replace(walkthrough, "0,\n        2\n      ]", "0,\n        0\n      ]");
    replace(walkthrough, "\"answer\": 1", "\"answer\": 4");
    replace(walkthrough, "2,\n        -1\n      ]", "2,\n        2\n      ]");
    replace(walkthrough, "\"3\",\n        \"10\"", "\"\",\n        \"10\"");
    replace(walkthrough, "\"hides\": [\n          \"best\"", "\"hides\": [\n          \"worst\"");
    replace(walkthrough, "2,\n          3\n        ]", "2,\n          2\n        ]");
    replace(walkthrough, "\"visited\": [\n        0", "\"visited\": [\n        9");
    replace(
        walkthrough,
        "2,\n          0\n        ],\n        [\n          0,",
        "0,\n          0\n        ],\n        [\n          0,");
    replace(
        walkthrough,
        "\"activeEdges\": [\n        [\n          1,\n          0",
        "\"activeEdges\": [\n        [\n          1,\n          3");
    replace(walkthrough, "\"rings\": [\n        0", "\"rings\": [\n        -2");
    replace(
        walkthrough,
        "\"window\": [\n        0,\n        1",
        "\"window\": [\n        0,\n        3");
    replace(
        walkthrough,
        "\"intervals\": [\n        [\n          1,\n          4",
        "\"intervals\": [\n        [\n          5,\n          4");
    replace(walkthrough, "\"chosen\": [\n        1", "\"chosen\": [\n        3");
    replace(walkthrough, "\"rows\": 2", "\"rows\": 4");
    replace(walkthrough, "\"weights\": [", "\"weights\": [\"9\", ");
    replace(walkthrough, "\"reads\": [\n        1", "\"reads\": [\n        9");
    replace(level.resolve("lesson.md"), "## Edge cases", "## Edges");

    List<String> problems = problemsAfterLoad();

    assertThat(problems)
        .anyMatch(p -> p.contains("step 2") && p.contains("marker"))
        .anyMatch(p -> p.contains("step 2") && p.contains("prediction answer"))
        .anyMatch(p -> p.contains("step 2") && p.contains("hides"))
        .anyMatch(p -> p.contains("step 2") && p.contains("swap"))
        .anyMatch(p -> p.contains("step 2") && p.contains("window needs"))
        .anyMatch(p -> p.contains("step 3") && p.contains("next needs"))
        .anyMatch(p -> p.contains("step 1") && p.contains("needs its parent"))
        .anyMatch(p -> p.contains("step 4") && p.contains("each edge"))
        .anyMatch(p -> p.contains("step 4") && p.contains("visited"))
        .anyMatch(p -> p.contains("step 4") && p.contains("positions"))
        .anyMatch(p -> p.contains("step 4") && p.contains("active edge"))
        .anyMatch(p -> p.contains("step 4") && p.contains("rings"))
        .anyMatch(p -> p.contains("step 5") && p.contains("intervals need"))
        .anyMatch(p -> p.contains("step 5") && p.contains("chosen needs"))
        .anyMatch(p -> p.contains("step 6") && p.contains("a table needs"))
        .anyMatch(p -> p.contains("step 4") && p.contains("weights need"))
        .anyMatch(p -> p.contains("step 6") && p.contains("reads needs"))
        .anyMatch(p -> p.contains("lesson.md") && p.contains("Edge cases"));
  }

  @Test
  void codeLinesAndCallsAreChecked() throws IOException {
    Path walkthrough = level.resolve("walkthrough.json");
    replace(walkthrough, "\"lines\": [\n      1,\n      1", "\"lines\": [\n      1,\n      2");
    replace(
        walkthrough,
        "\"depth\": 1,\n          \"state\": \"done\"",
        "\"depth\": 9,\n          \"state\": \"done\"");

    List<String> problems = problemsAfterLoad();

    assertThat(problems)
        .anyMatch(p -> p.contains("step 3") && p.contains("lines needs"))
        .anyMatch(p -> p.contains("step 1") && p.contains("each call needs"));
  }

  @Test
  void onlyOneCallIsActive() throws IOException {
    replace(level.resolve("walkthrough.json"), "\"state\": \"waiting\"", "\"state\": \"active\"");

    assertThat(problemsAfterLoad())
        .anyMatch(p -> p.contains("step 1") && p.contains("at most one call can be active"));
  }

  @Test
  void figureRulesAreChecked() throws IOException {
    Path lesson = level.resolve("lesson.md");
    replace(lesson, "\"items\": [\"A\"]}, {\"op\": \"pop", "\"items\": [\"\"]}, {\"op\": \"pop");
    replace(
        lesson,
        "{\"kind\": \"queue\", \"frames\": [{\"op\": \"enqueue(A)\", \"items\": [\"A\"]}, ",
        "{\"kind\": \"queue\", \"frames\": [");
    replace(lesson, "\"next\": [-1, 0]", "\"next\": [-1, 5]");
    replace(lesson, "plates.webp", "plates.png");
    replace(lesson, "\"kind\": \"image\",", "\"kind\": \"image\", \"size\": 2,");

    List<String> problems = problemsAfterLoad();

    assertThat(problems)
        .anyMatch(p -> p.contains("figure 1, frame 1") && p.contains("must not be blank"))
        .anyMatch(p -> p.contains("figure 2") && p.contains("frames"))
        .anyMatch(p -> p.contains("figure 3, frame 2") && p.contains("next"))
        .anyMatch(p -> p.contains("figure 4") && p.contains("not valid figure JSON"));
  }

  @Test
  void figureImagesMustBeWebp() throws IOException {
    replace(level.resolve("lesson.md"), "plates.webp", "plates.png");

    assertThat(problemsAfterLoad())
        .anyMatch(p -> p.contains("figure 4") && p.contains("/lesson-images/"));
  }
}
