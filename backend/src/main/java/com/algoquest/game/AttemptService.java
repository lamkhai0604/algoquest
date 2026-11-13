package com.algoquest.game;

import com.algoquest.content.ContentCatalog;
import com.algoquest.content.model.Problem;
import com.algoquest.game.AttemptStore.StoredAttempt;
import com.algoquest.game.domain.Difficulty;
import com.algoquest.game.domain.GameRules;
import com.algoquest.game.domain.LevelRules;
import com.algoquest.game.domain.ProblemProgress;
import com.algoquest.game.domain.XpAward;
import com.algoquest.game.domain.XpRules;
import com.algoquest.grading.Grader;
import com.algoquest.grading.GraderUnavailableException;
import com.algoquest.grading.GradingResult;
import com.algoquest.shared.web.ApiException;
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZoneOffset;
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

  /** Longer than any time limit; stored times are capped here. */
  private static final int NO_TIME_BONUS_SECONDS = 24 * 60 * 60;

  private static final Logger log = LoggerFactory.getLogger(AttemptService.class);

  public static final String EXPLAIN = "explain";
  public static final String PRACTICE = "practice";

  /** An attempt; {@code mode} is {@code explain} (default) or {@code practice}. */
  public record AttemptRequest(UUID attemptId, String text, String mode) {}

  /** What the player sees after grading. */
  public record AttemptResult(
      UUID attemptId,
      String mode,
      String explanation,
      int pattern,
      int steps,
      int complexity,
      int edgeCases,
      int total,
      boolean solved,
      String feedback,
      int xpGained,
      int levelXp,
      int levelTarget) {

    /** The view of a stored attempt, with the level bar as it is now. */
    static AttemptResult of(GameRules rules, StoredAttempt attempt, int levelXp, int level) {
      GradingResult result = attempt.result();
      return new AttemptResult(
          attempt.id(),
          attempt.mode(),
          attempt.explanation(),
          result.pattern(),
          result.steps(),
          result.complexity(),
          result.edgeCases(),
          result.total(),
          result.total() >= rules.passScore(),
          result.feedback(),
          attempt.xpGained(),
          LevelRules.barXp(rules, levelXp, level),
          XpRules.levelTarget(rules, level));
    }
  }

  private final GameService game;
  private final HintService hints;
  private final ContentCatalog catalog;
  private final Grader grader;
  private final AttemptStore attempts;
  private final ProgressStore progress;
  private final TransactionTemplate transaction;
  private final ProblemTimeStore times;
  private final ProfileService profiles;
  private final GameRulesService rules;

  public AttemptService(
      GameService game,
      HintService hints,
      ContentCatalog catalog,
      Grader grader,
      AttemptStore attempts,
      ProgressStore progress,
      ProblemTimeStore times,
      ProfileService profiles,
      GameRulesService rules,
      PlatformTransactionManager transactionManager) {
    this.game = game;
    this.hints = hints;
    this.catalog = catalog;
    this.grader = grader;
    this.attempts = attempts;
    this.progress = progress;
    this.times = times;
    this.profiles = profiles;
    this.rules = rules;
    this.transaction = new TransactionTemplate(transactionManager);
  }

  public AttemptResult submit(UUID userId, String problemId, AttemptRequest request) {
    return submit(userId, problemId, request, ZoneOffset.UTC);
  }

  /** Grades and records an attempt; {@code zone} decides the streak's calendar day. */
  public AttemptResult submit(UUID userId, String problemId, AttemptRequest request, ZoneId zone) {
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
    String mode = request.mode() == null ? EXPLAIN : request.mode();
    if (!mode.equals(EXPLAIN) && !mode.equals(PRACTICE)) {
      throw invalid("mode must be explain or practice.");
    }

    StoredAttempt earlier = attempts.find(request.attemptId()).orElse(null);
    if (earlier != null) {
      return stored(earlier, userId, problem);
    }

    if (mode.equals(PRACTICE)) {
      requirePracticeOpen(userId, problem);
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
    // The time bonus counts active working time, as recorded by the server (D-043).
    int seconds = Math.min(times.activeSeconds(userId, problem.id()), NO_TIME_BONUS_SECONDS);

    if (mode.equals(PRACTICE)) {
      return transaction.execute(
          status -> {
            AttemptResult practiced =
                recordPractice(userId, problem, request, text, seconds, result, gradingMs);
            if (practiced.solved()) {
              profiles.recordSolve(userId, zone);
            }
            return practiced;
          });
    }
    return transaction.execute(
        status -> {
          ProblemProgress before = progress.lock(userId, problem.id(), problem.level());
          int hintsUsed = hints.usedFor(userId, problem.id());
          GameRules current = rules.current();
          XpAward award =
              XpRules.award(
                  current,
                  before,
                  result.total(),
                  Difficulty.fromLabel(problem.difficulty()),
                  Duration.ofSeconds(seconds),
                  hintsUsed,
                  false);
          StoredAttempt attempt =
              new StoredAttempt(
                  request.attemptId(),
                  userId,
                  problem.id(),
                  EXPLAIN,
                  text,
                  result,
                  award.xpGained());
          boolean saved =
              attempts.insert(attempt, EXPLAIN, text, hintsUsed, seconds, grader.name(), gradingMs);
          if (!saved) {
            // The same attempt was saved by a concurrent request: return it, award nothing.
            return stored(attempts.find(request.attemptId()).orElseThrow(), userId, problem);
          }
          progress.save(userId, problem.id(), award.after());
          if (result.total() >= current.passScore()) {
            profiles.recordSolve(userId, zone);
          }
          return view(attempt, userId, problem);
        });
  }

  /**
   * A practice-round attempt (FR-09): a solved problem explained again, with the hints hidden. A
   * score of 70 or more marks it Done and adds up to 10 XP, never past a full level bar.
   */
  private AttemptResult recordPractice(
      UUID userId,
      Problem problem,
      AttemptRequest request,
      String text,
      int seconds,
      GradingResult result,
      long gradingMs) {
    progress.lock(userId, problem.id(), problem.level());
    requirePracticeOpen(userId, problem);
    int levelXp = progress.xpByLevel(userId).getOrDefault(problem.level(), 0);
    GameRules current = rules.current();
    boolean passed = result.total() >= current.passScore();
    int gained = passed ? LevelRules.practiceDoneXp(current, levelXp, problem.level()) : 0;
    StoredAttempt attempt =
        new StoredAttempt(
            request.attemptId(), userId, problem.id(), PRACTICE, text, result, gained);
    if (!attempts.insert(attempt, PRACTICE, text, 0, seconds, grader.name(), gradingMs)) {
      return stored(attempts.find(request.attemptId()).orElseThrow(), userId, problem);
    }
    if (passed) {
      progress.markPracticeDone(userId, problem.id(), gained);
    }
    return view(attempt, userId, problem);
  }

  /** The practice round is open at 70% of the level bar, for solved problems not yet Done. */
  private void requirePracticeOpen(UUID userId, Problem problem) {
    int levelXp = progress.xpByLevel(userId).getOrDefault(problem.level(), 0);
    GameRules current = rules.current();
    if (!LevelRules.practiceOpen(current, levelXp, problem.level())) {
      throw new ApiException(
          HttpStatus.FORBIDDEN,
          "Forbidden",
          "The practice round opens at " + current.practiceOpenPercent() + "% of the level bar.");
    }
    boolean solved =
        progress.byProblem(userId).getOrDefault(problem.id(), ProblemProgress.NEW).solved();
    if (!solved) {
      throw new ApiException(
          HttpStatus.CONFLICT, "Conflict", "Solve this problem before practising it.");
    }
    if (progress.practiceDone(userId).contains(problem.id())) {
      throw new ApiException(HttpStatus.CONFLICT, "Conflict", "This problem is already Done.");
    }
  }

  private AttemptResult stored(StoredAttempt attempt, UUID userId, Problem problem) {
    if (!attempt.userId().equals(userId) || !attempt.problemId().equals(problem.id())) {
      throw new ApiException(
          HttpStatus.CONFLICT, "Conflict", "This attempt ID was already used. Submit again.");
    }
    return view(attempt, userId, problem);
  }

  private AttemptResult view(StoredAttempt attempt, UUID userId, Problem problem) {
    int levelXp = progress.xpByLevel(userId).getOrDefault(problem.level(), 0);
    return AttemptResult.of(rules.current(), attempt, levelXp, problem.level());
  }

  private static ApiException invalid(String detail) {
    return new ApiException(HttpStatus.BAD_REQUEST, "Invalid attempt", detail);
  }
}
