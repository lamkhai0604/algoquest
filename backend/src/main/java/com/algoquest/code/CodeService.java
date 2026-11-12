package com.algoquest.code;

import com.algoquest.content.model.Problem;
import com.algoquest.content.model.TestCase;
import com.algoquest.game.GameService;
import com.algoquest.game.ProgressStore;
import com.algoquest.game.domain.Difficulty;
import com.algoquest.game.domain.LevelRules;
import com.algoquest.game.domain.ProblemProgress;
import com.algoquest.game.domain.XpAward;
import com.algoquest.game.domain.XpRules;
import com.algoquest.shared.web.ApiException;
import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Code answers for double XP (FR-07). A player who has solved a problem's explanation may run code
 * against its hidden tests; all tests passing doubles the problem's XP once. JavaScript runs in the
 * browser, which receives only the test inputs and sends back the outputs (D-035); Java runs on
 * Judge0 within a daily quota (D-032). Expected outputs never leave the server.
 */
@Service
public class CodeService {

  public static final String JAVASCRIPT = "javascript";
  public static final String JAVA = "java";
  public static final int MAX_CODE_LENGTH = 20_000;

  private static final Logger log = LoggerFactory.getLogger(CodeService.class);
  private static final Pattern JS_FUNCTION = Pattern.compile("function\\s+(\\w+)\\s*\\(");
  private static final JsonMapper JSON = JsonMapper.builder().build();

  private final GameService game;
  private final ProgressStore progress;
  private final CodeRunStore runs;
  private final JavaRunner javaRunner;
  private final Clock clock;
  private final TransactionTemplate transaction;
  private final int javaDailyLimit;

  public CodeService(
      GameService game,
      ProgressStore progress,
      CodeRunStore runs,
      JavaRunner javaRunner,
      Clock clock,
      PlatformTransactionManager transactionManager,
      @Value("${algoquest.code.java.daily-limit:45}") int javaDailyLimit) {
    this.game = game;
    this.progress = progress;
    this.runs = runs;
    this.javaRunner = javaRunner;
    this.clock = clock;
    this.transaction = new TransactionTemplate(transactionManager);
    this.javaDailyLimit = javaDailyLimit;
  }

  /**
   * What the code panel needs: the JavaScript function to call, the hidden test inputs (never the
   * expected outputs), and the Java runs left today.
   */
  public record CodeSetup(
      String functionName,
      List<List<Object>> inputs,
      int javaRunsLeft,
      int javaDailyLimit,
      boolean solved,
      boolean codeBonusAwarded) {}

  /**
   * A run of the player's code. For JavaScript, {@code outputs} and {@code errors} are required.
   */
  public record CodeSubmission(
      String language, String code, List<Object> outputs, List<String> errors) {}

  /**
   * The result of a run.
   *
   * @param failedInput the first failing test's input, or null when all pass
   * @param failedOutput what the code returned for it, as JSON text, or null
   * @param failedError the error on that test, or null
   */
  public record CodeResult(
      String language,
      int passed,
      int total,
      List<Object> failedInput,
      String failedOutput,
      String failedError,
      String compileError,
      int xpGained,
      boolean codeBonusAwarded,
      int levelXp,
      int levelTarget,
      int javaRunsLeft) {}

  public CodeSetup setup(UUID userId, String problemId) {
    Problem problem = game.playableProblem(userId, problemId);
    ProblemProgress mine =
        progress.byProblem(userId).getOrDefault(problem.id(), ProblemProgress.NEW);
    List<List<Object>> inputs = new ArrayList<>();
    for (TestCase test : problem.tests()) {
      inputs.add(test.input());
    }
    return new CodeSetup(
        jsFunctionName(problem),
        inputs,
        javaRunsLeft(),
        javaDailyLimit,
        mine.solved(),
        mine.codeBonusAwarded());
  }

  public CodeResult run(UUID userId, String problemId, CodeSubmission submission) {
    Problem problem = game.playableProblem(userId, problemId);
    String language = submission == null ? null : submission.language();
    String code = submission == null || submission.code() == null ? "" : submission.code();
    if (!JAVASCRIPT.equals(language) && !JAVA.equals(language)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid language", "Use javascript or java.");
    }
    if (code.isBlank() || code.length() > MAX_CODE_LENGTH) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "Invalid code",
          "Write some code, up to " + MAX_CODE_LENGTH + " characters.");
    }
    ProblemProgress mine =
        progress.byProblem(userId).getOrDefault(problem.id(), ProblemProgress.NEW);
    if (!mine.solved()) {
      throw new ApiException(
          HttpStatus.CONFLICT,
          "Explain first",
          "Solve the explanation (score 70 or more) before writing code.");
    }
    List<TestCase> tests = problem.tests();
    List<TestOutcome> outcomes;
    String compileError = null;
    if (JAVASCRIPT.equals(language)) {
      outcomes = javascriptOutcomes(submission, tests.size());
    } else {
      if (javaRunsLeft() <= 0) {
        throw new ApiException(
            HttpStatus.TOO_MANY_REQUESTS,
            "Java runs used up",
            "Java runs are used up for today. JavaScript still works, or try Java again tomorrow.");
      }
      JavaRun run;
      try {
        run = javaRunner.run(problem, code);
      } catch (RunnerUnavailableException e) {
        log.warn("Java runner unavailable for {}: {}", problem.id(), e.getMessage());
        runs.save(UUID.randomUUID(), userId, problem.id(), JAVA, code, 0, 0, 0, clock.instant());
        throw new ApiException(
            HttpStatus.SERVICE_UNAVAILABLE,
            "Java runner unavailable",
            "The Java runner is unavailable right now. Try JavaScript, or Java again later.");
      }
      compileError = run.compileError();
      outcomes = compileError != null ? List.of() : run.outcomes();
    }
    int passed = 0;
    int firstFailure = -1;
    for (int i = 0; i < tests.size(); i++) {
      TestOutcome outcome = i < outcomes.size() ? outcomes.get(i) : null;
      boolean ok =
          outcome != null
              && outcome.error() == null
              && sameJson(JSON.valueToTree(tests.get(i).expected()), outcome.output());
      if (ok) {
        passed++;
      } else if (firstFailure < 0) {
        firstFailure = i;
      }
    }
    final List<TestOutcome> results = outcomes;
    final String compileMessage = compileError;
    boolean allPassed = compileError == null && passed == tests.size();
    int total = tests.size();
    int finalPassed = compileError == null ? passed : 0;
    int failedIndex = compileError == null ? firstFailure : -1;
    return transaction.execute(
        status -> {
          ProblemProgress before = progress.lock(userId, problem.id(), problem.level());
          int gained = 0;
          ProblemProgress after = before;
          if (allPassed) {
            XpAward award =
                XpRules.award(
                    before,
                    XpRules.PASS_SCORE,
                    Difficulty.fromLabel(problem.difficulty()),
                    Duration.ZERO,
                    0,
                    true);
            gained = award.xpGained();
            after = award.after();
            if (gained > 0) {
              progress.save(userId, problem.id(), after);
            }
          }
          runs.save(
              UUID.randomUUID(),
              userId,
              problem.id(),
              language,
              code,
              finalPassed,
              total,
              gained,
              clock.instant());
          int levelXp = progress.xpByLevel(userId).getOrDefault(problem.level(), 0);
          TestOutcome failed =
              failedIndex >= 0 && failedIndex < results.size() ? results.get(failedIndex) : null;
          return new CodeResult(
              language,
              finalPassed,
              total,
              failedIndex >= 0 ? tests.get(failedIndex).input() : null,
              failed == null || failed.output() == null ? null : failed.output().toString(),
              failedIndex < 0 ? null : failed == null ? "No output for this test" : failed.error(),
              compileMessage,
              gained,
              after.codeBonusAwarded(),
              LevelRules.barXp(levelXp, problem.level()),
              XpRules.levelTarget(problem.level()),
              javaRunsLeft());
        });
  }

  private int javaRunsLeft() {
    return Math.max(0, javaDailyLimit - runs.countToday(JAVA, clock.instant()));
  }

  private static List<TestOutcome> javascriptOutcomes(CodeSubmission submission, int tests) {
    List<Object> outputs = submission.outputs();
    List<String> errors = submission.errors();
    if (outputs == null || outputs.size() != tests || (errors != null && errors.size() != tests)) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST, "Invalid outputs", "Send one output per test, in order.");
    }
    List<TestOutcome> result = new ArrayList<>();
    for (int i = 0; i < tests; i++) {
      String error = errors == null ? null : errors.get(i);
      result.add(
          error != null && !error.isBlank()
              ? TestOutcome.failed(error.length() > 200 ? error.substring(0, 200) : error)
              : TestOutcome.of(JSON.valueToTree(outputs.get(i))));
    }
    return result;
  }

  static String jsFunctionName(Problem problem) {
    String starter = problem.starterCode() == null ? null : problem.starterCode().get(JAVASCRIPT);
    if (starter == null) {
      return null;
    }
    Matcher m = JS_FUNCTION.matcher(starter);
    return m.find() ? m.group(1) : null;
  }

  /** JSON equality where numbers compare by value, so 9 equals 9.0. */
  static boolean sameJson(JsonNode expected, JsonNode actual) {
    if (expected == null || actual == null) {
      return expected == actual || (expected != null && expected.isNull() && actual == null);
    }
    if (expected.isNull() || actual.isNull()) {
      return expected.isNull() && actual.isNull();
    }
    if (expected.isNumber() && actual.isNumber()) {
      return expected.decimalValue().compareTo(actual.decimalValue()) == 0;
    }
    if (expected.isArray() && actual.isArray()) {
      if (expected.size() != actual.size()) {
        return false;
      }
      for (int i = 0; i < expected.size(); i++) {
        if (!sameJson(expected.get(i), actual.get(i))) {
          return false;
        }
      }
      return true;
    }
    if (expected.isObject() && actual.isObject()) {
      if (expected.size() != actual.size()) {
        return false;
      }
      Iterator<Map.Entry<String, JsonNode>> fields = expected.properties().iterator();
      while (fields.hasNext()) {
        Map.Entry<String, JsonNode> field = fields.next();
        if (!sameJson(field.getValue(), actual.get(field.getKey()))) {
          return false;
        }
      }
      return true;
    }
    return expected.equals(actual);
  }
}
