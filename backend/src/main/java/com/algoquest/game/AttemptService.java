package com.algoquest.game;

import com.algoquest.content.ContentCatalog;
import com.algoquest.content.model.Problem;
import com.algoquest.game.AttemptStore.StoredAttempt;
import com.algoquest.game.domain.Difficulty;
import com.algoquest.game.domain.LevelRules;
import com.algoquest.game.domain.ProblemProgress;
import com.algoquest.game.domain.XpAward;
import com.algoquest.game.domain.XpRules;
import com.algoquest.grading.Grader;
import com.algoquest.grading.GraderUnavailableException;
import com.algoquest.grading.GradingResult;
import com.algoquest.shared.web.ApiException;
import java.time.Duration;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Grades an explanation and records the attempt (FR-05, FR-08). The grader is called outside any
 * database transaction. If it fails, nothing is recorded. A repeated attempt ID returns the stored
 * result, so a retry is never graded or rewarded twice (NFR-09).
 */
@Service
public class AttemptService {

  public static final int MAX_LENGTH = 2000;
  private static final int NO_TIME_BONUS_SECONDS = 24 * 60 * 60;
  private static final Logger log = LoggerFactory.getLogger(AttemptService.class);

  /** The request body of an attempt. {@code secondsTaken} is the time shown by the page timer. */
  public record AttemptRequest(UUID attemptId, String text, Integer secondsTaken) {}

  /** What the player sees after grading. */
  public record AttemptResult(
      UUID attemptId,
      int pattern,
      int steps,
      int complexity,
      int edgeCases,
      int total,
      boolean solved,
      String feedback,
      int xpGained,
      int levelXp,
      int levelTarget) {}

  private final GameService game;
  private final HintService hints;
  private final ContentCatalog catalog;
  private final Grader grader;
  private final AttemptStore attempts;
  private final ProgressStore progress;
  private final TransactionTemplate transaction;

  public AttemptService(
      GameService game,
      HintService hints,
      ContentCatalog catalog,
      Grader grader,
      AttemptStore attempts,
      ProgressStore progress,
      PlatformTransactionManager transactionManager) {
    this.game = game;
    this.hints = hints;
    this.catalog = catalog;
    this.grader = grader;
    this.attempts = attempts;
    this.progress = progress;
    this.transaction = new TransactionTemplate(transactionManager);
  }

  public AttemptResult submit(UUID userId, String problemId, AttemptRequest request) {
    Problem problem = game.playableProblem(userId, problemId);
    if (request == null || request.attemptId() == null) {
      throw invalid("attemptId is required.");
    }
    String text = request.text() == null ? "" : request.text().strip();
    if (text.isEmpty()) {
      throw invalid("Write your explanation before submitting.");
    }
    if (text.length() > MAX_LENGTH) {
      throw invalid("Your explanation is longer than " + MAX_LENGTH + " characters.");
    }
    int seconds = seconds(request.secondsTaken());

    StoredAttempt earlier = attempts.find(request.attemptId()).orElse(null);
    if (earlier != null) {
      return stored(earlier, userId, problem);
    }

    String levelTitle = catalog.level(problem.level()).orElseThrow().info().title();
    long started = System.nanoTime();
    GradingResult result;
    try {
      result = grader.grade(problem, levelTitle, text);
    } catch (GraderUnavailableException e) {
      log.warn("Grading unavailable for problem {}: {}", problem.id(), e.reason());
      throw e;
    }
    long gradingMs = (System.nanoTime() - started) / 1_000_000;

    return transaction.execute(
        status -> {
          ProblemProgress before = progress.lock(userId, problem.id(), problem.level());
          int hintsUsed = hints.usedFor(userId, problem.id());
          XpAward award =
              XpRules.award(
                  before,
                  result.total(),
                  Difficulty.fromLabel(problem.difficulty()),
                  Duration.ofSeconds(seconds),
                  hintsUsed,
                  false);
          StoredAttempt attempt =
              new StoredAttempt(
                  request.attemptId(), userId, problem.id(), result, award.xpGained());
          if (!attempts.insert(attempt, text, hintsUsed, seconds, grader.name(), gradingMs)) {
            // The same attempt was saved by a concurrent request: return it, award nothing.
            return stored(attempts.find(request.attemptId()).orElseThrow(), userId, problem);
          }
          progress.save(userId, problem.id(), award.after());
          return view(attempt, userId, problem);
        });
  }

  private AttemptResult stored(StoredAttempt attempt, UUID userId, Problem problem) {
    if (!attempt.userId().equals(userId) || !attempt.problemId().equals(problem.id())) {
      throw new ApiException(
          HttpStatus.CONFLICT, "Conflict", "This attempt ID was already used. Submit again.");
    }
    return view(attempt, userId, problem);
  }

  private AttemptResult view(StoredAttempt attempt, UUID userId, Problem problem) {
    GradingResult result = attempt.result();
    int levelXp = progress.xpByLevel(userId).getOrDefault(problem.level(), 0);
    return new AttemptResult(
        attempt.id(),
        result.pattern(),
        result.steps(),
        result.complexity(),
        result.edgeCases(),
        result.total(),
        result.total() >= XpRules.PASS_SCORE,
        result.feedback(),
        attempt.xpGained(),
        LevelRules.barXp(levelXp, problem.level()),
        XpRules.levelTarget(problem.level()));
  }

  private static int seconds(Integer secondsTaken) {
    if (secondsTaken == null || secondsTaken < 0) {
      return NO_TIME_BONUS_SECONDS;
    }
    return Math.min(secondsTaken, NO_TIME_BONUS_SECONDS);
  }

  private static ApiException invalid(String detail) {
    return new ApiException(HttpStatus.BAD_REQUEST, "Invalid attempt", detail);
  }
}
