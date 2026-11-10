package com.algoquest.game;

import com.algoquest.content.ContentCatalog;
import com.algoquest.content.ContentViews.ProblemView;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.Problem;
import com.algoquest.game.TestStore.StoredAnswer;
import com.algoquest.game.TestStore.StoredTest;
import com.algoquest.game.domain.LevelRules;
import com.algoquest.game.domain.LevelState;
import com.algoquest.grading.Grader;
import com.algoquest.grading.GraderUnavailableException;
import com.algoquest.grading.GradingResult;
import com.algoquest.shared.web.ApiException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Level-up tests (FR-10). The server owns the clock: answers are saved while the test runs and
 * graded at submit. After the end time, answers can no longer change, and a submit grades what was
 * saved; unanswered problems score 0.
 */
@Service
public class TestService {

  private static final Logger log = LoggerFactory.getLogger(TestService.class);

  /** One problem of a test with the player's answer and, after submit, its grade. */
  public record TestProblem(ProblemView problem, String answer, GradingResult result) {}

  /**
   * A test as the player sees it.
   *
   * @param status {@code running}, {@code timeUp} (waiting for submit), or {@code submitted}
   * @param nextLevelState the next level's state after this test, once submitted
   */
  public record TestView(
      UUID id,
      int level,
      String status,
      Instant startedAt,
      Instant endsAt,
      Instant serverTime,
      List<TestProblem> problems,
      Integer score,
      LevelState nextLevelState) {}

  public record AnswerRequest(String problemId, String text) {}

  private final GameService game;
  private final ContentCatalog catalog;
  private final ProgressStore progress;
  private final TestStore tests;
  private final Grader grader;
  private final Clock clock;
  private final Duration duration;
  private final TransactionTemplate transaction;

  public TestService(
      GameService game,
      ContentCatalog catalog,
      ProgressStore progress,
      TestStore tests,
      Grader grader,
      Clock clock,
      @Value("${algoquest.test.duration:PT2H}") Duration duration,
      PlatformTransactionManager transactionManager) {
    this.game = game;
    this.catalog = catalog;
    this.progress = progress;
    this.tests = tests;
    this.grader = grader;
    this.clock = clock;
    this.duration = duration;
    this.transaction = new TransactionTemplate(transactionManager);
  }

  /** Starts a test, or returns the running test of the same level. */
  public TestView start(UUID userId, int level) {
    return transaction.execute(
        status -> {
          StoredTest running = tests.running(userId).orElse(null);
          if (running != null) {
            if (running.level() != level) {
              throw conflict("Finish your Level " + running.level() + " test first.");
            }
            return view(running);
          }
          LevelContent content = catalog.level(level).orElse(null);
          if (content == null || !content.available()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Not Found", "This level has no test.");
          }
          if (game.state(userId, level) == LevelState.LOCKED) {
            throw forbidden("This level is locked.");
          }
          int xp = progress.xpByLevel(userId).getOrDefault(level, 0);
          if (!LevelRules.testOpen(xp, level)) {
            throw forbidden("The level-up test opens when the level bar is full.");
          }
          List<String> problemIds =
              content.problems().stream()
                  .filter(p -> "test".equals(p.use()) && p.isReady())
                  .map(Problem::id)
                  .sorted()
                  .limit(LevelRules.TEST_PROBLEMS)
                  .toList();
          if (problemIds.size() < LevelRules.TEST_PROBLEMS) {
            throw conflict("This level's test is not ready yet.");
          }
          Instant now = clock.instant();
          Instant endsAt = now.plus(duration);
          UUID id = UUID.randomUUID();
          StoredTest test = new StoredTest(id, userId, level, problemIds, now, endsAt, null, null);
          tests.insert(test);
          return view(test);
        });
  }

  public TestView get(UUID userId, UUID testId) {
    return view(owned(userId, testId));
  }

  /** Saves one answer while the test runs. */
  public TestView saveAnswer(UUID userId, UUID testId, AnswerRequest request) {
    return transaction.execute(
        status -> {
          StoredTest test = tests.lock(userId, testId).orElseThrow(TestService::notFound);
          if (test.submittedAt() != null) {
            throw conflict("This test was already submitted.");
          }
          if (!clock.instant().isBefore(test.endsAt())) {
            throw conflict("Time is up. Submit the test to see your score.");
          }
          if (request == null || !test.problemIds().contains(request.problemId())) {
            throw invalid("This problem is not part of the test.");
          }
          String text = request.text() == null ? "" : request.text().strip();
          if (text.length() > AttemptService.MAX_LENGTH) {
            throw invalid(
                "Your explanation is longer than " + AttemptService.MAX_LENGTH + " characters.");
          }
          tests.saveAnswer(testId, request.problemId(), text, clock.instant());
          return view(test);
        });
  }

  /**
   * Grades the saved answers and finishes the test. Grading happens outside the database
   * transaction; each grade is stored as soon as it arrives, so a failure part-way loses nothing
   * and a later submit grades only what is left.
   */
  public TestView submit(UUID userId, UUID testId) {
    StoredTest test = owned(userId, testId);
    if (test.submittedAt() != null) {
      return view(test);
    }
    String levelTitle = catalog.level(test.level()).orElseThrow().info().title();
    for (Map.Entry<String, StoredAnswer> entry : tests.answers(testId).entrySet()) {
      StoredAnswer answer = entry.getValue();
      if (answer.result() == null && !answer.text().isBlank()) {
        Problem problem = catalog.problem(entry.getKey()).orElseThrow();
        GradingResult result;
        try {
          result = grader.grade(problem, levelTitle, answer.text());
        } catch (GraderUnavailableException e) {
          log.warn("Grading unavailable for test {}: {}", testId, e.reason());
          throw e;
        }
        tests.saveGrade(testId, entry.getKey(), answer.text(), result);
      }
    }
    return transaction.execute(
        status -> {
          StoredTest locked = tests.lock(userId, testId).orElseThrow(TestService::notFound);
          if (locked.submittedAt() != null) {
            return view(locked);
          }
          Map<String, StoredAnswer> answers = tests.answers(testId);
          List<Integer> totals = new ArrayList<>();
          for (String problemId : locked.problemIds()) {
            StoredAnswer answer = answers.get(problemId);
            if (answer == null || answer.text().isBlank()) {
              totals.add(0);
            } else if (answer.result() == null) {
              throw conflict("An answer changed while grading. Submit again.");
            } else {
              totals.add(answer.result().total());
            }
          }
          int score = LevelRules.testScore(totals);
          tests.finish(testId, clock.instant(), score);
          return view(tests.find(userId, testId).orElseThrow());
        });
  }

  private StoredTest owned(UUID userId, UUID testId) {
    return tests.find(userId, testId).orElseThrow(TestService::notFound);
  }

  private TestView view(StoredTest test) {
    Instant now = clock.instant();
    boolean submitted = test.submittedAt() != null;
    Map<String, StoredAnswer> answers = tests.answers(test.id());
    List<TestProblem> problems = new ArrayList<>();
    for (String problemId : test.problemIds()) {
      Problem problem = catalog.problem(problemId).orElseThrow();
      StoredAnswer answer = answers.get(problemId);
      problems.add(
          new TestProblem(
              ProblemView.of(problem),
              answer == null ? "" : answer.text(),
              submitted && answer != null ? answer.result() : null));
    }
    String status = submitted ? "submitted" : now.isBefore(test.endsAt()) ? "running" : "timeUp";
    LevelState next = submitted ? game.state(test.userId(), test.level() + 1) : null;
    return new TestView(
        test.id(),
        test.level(),
        status,
        test.startedAt(),
        test.endsAt(),
        now,
        problems,
        test.score(),
        next);
  }

  private static ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Test not found.");
  }

  private static ApiException conflict(String detail) {
    return new ApiException(HttpStatus.CONFLICT, "Conflict", detail);
  }

  private static ApiException forbidden(String detail) {
    return new ApiException(HttpStatus.FORBIDDEN, "Forbidden", detail);
  }

  private static ApiException invalid(String detail) {
    return new ApiException(HttpStatus.BAD_REQUEST, "Invalid answer", detail);
  }
}
