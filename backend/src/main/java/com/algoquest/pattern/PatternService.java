package com.algoquest.pattern;

import com.algoquest.content.ContentCatalog;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.PatternChallenge;
import com.algoquest.content.model.PatternChallenge.Approach;
import com.algoquest.game.GameService;
import com.algoquest.grading.GraderUnavailableException;
import com.algoquest.grading.PatternGrader;
import com.algoquest.grading.ReasoningResult;
import com.algoquest.shared.web.ApiException;
import java.time.Clock;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Pattern Recognition (D-057). Whether a choice is correct comes only from the content's label; the
 * grader scores only the written reason. No XP is awarded in the pilot.
 */
@Service
public class PatternService {

  /** Answers per challenge per player per UTC day: protects the free grading quota. */
  static final int DAILY_LIMIT = 5;

  static final int MIN_REASON = 10;
  static final int MAX_REASON = 1000;

  private static final Logger log = LoggerFactory.getLogger(PatternService.class);

  private final ContentCatalog catalog;
  private final GameService game;
  private final PatternGrader grader;
  private final PatternStore store;
  private final Clock clock;

  public PatternService(
      ContentCatalog catalog,
      GameService game,
      PatternGrader grader,
      PatternStore store,
      Clock clock) {
    this.catalog = catalog;
    this.game = game;
    this.grader = grader;
    this.store = store;
    this.clock = clock;
  }

  /** A challenge in a level's list, with the best label this player has reached, if any. */
  public record ChallengeSummary(String id, String title, String bestLabel) {}

  /** What a player sees before answering: the approaches without labels or reasons. */
  public record ChallengeView(
      String id,
      int level,
      String levelTitle,
      String title,
      String statement,
      List<String> examples,
      List<String> constraints,
      List<Choice> approaches,
      int answersLeftToday) {}

  public record Choice(String id, String name, String hint) {}

  public record AnswerRequest(String approach, String explanation) {}

  /**
   * The result of an answer. {@code correct} and {@code label} come from the content; {@code
   * reasonScore}, its parts, and {@code feedback} come from the grader. {@code comparison} lists
   * every approach with its label, complexity, and reason, best first.
   */
  public record AnswerResult(
      String approach,
      String label,
      boolean correct,
      String bestApproach,
      int reasonScore,
      int reason,
      int complexity,
      String feedback,
      List<Approach> comparison,
      int answersLeftToday) {}

  public List<ChallengeSummary> list(UUID userId, int level) {
    LevelContent content = availableLevel(level);
    game.requireUnlocked(userId, level);
    Map<String, String> best = store.bestLabels(userId);
    return content.patterns().stream()
        .map(c -> new ChallengeSummary(c.id(), c.title(), best.get(c.id())))
        .toList();
  }

  public ChallengeView view(UUID userId, String id) {
    PatternChallenge challenge = playable(userId, id);
    return new ChallengeView(
        challenge.id(),
        challenge.level(),
        catalog.level(challenge.level()).orElseThrow().info().title(),
        challenge.title(),
        challenge.statement(),
        challenge.examples(),
        challenge.constraints(),
        // By name, so the order never hints at the best approach.
        challenge.approaches().stream()
            .sorted(Comparator.comparing(Approach::name))
            .map(a -> new Choice(a.id(), a.name(), a.hint()))
            .toList(),
        answersLeft(userId, id));
  }

  public AnswerResult answer(UUID userId, String id, AnswerRequest request) {
    PatternChallenge challenge = playable(userId, id);
    Approach chosen = request == null ? null : challenge.approach(request.approach());
    if (chosen == null) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST, "Bad Request", "Choose one of the approaches.");
    }
    String text = request.explanation() == null ? "" : request.explanation().strip();
    if (text.length() < MIN_REASON || text.length() > MAX_REASON) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "Bad Request",
          "Write a reason between " + MIN_REASON + " and " + MAX_REASON + " characters.");
    }
    int left = answersLeft(userId, id);
    if (left <= 0) {
      throw new ApiException(
          HttpStatus.TOO_MANY_REQUESTS,
          "Daily limit reached",
          "You have answered this challenge " + DAILY_LIMIT + " times today. Try again tomorrow.");
    }
    long started = System.nanoTime();
    ReasoningResult graded;
    try {
      graded = grader.grade(challenge, chosen, text);
    } catch (GraderUnavailableException e) {
      log.warn("Pattern grading unavailable for {}: {}", challenge.id(), e.reason());
      throw e;
    }
    int gradingMs = (int) ((System.nanoTime() - started) / 1_000_000);
    store.save(
        userId,
        challenge.id(),
        chosen.id(),
        chosen.label(),
        text,
        graded.reason(),
        graded.complexity(),
        graded.feedback(),
        grader.name(),
        gradingMs,
        clock.instant());
    List<Approach> comparison =
        challenge.approaches().stream()
            .sorted((a, b) -> PatternStore.rank(b.label()) - PatternStore.rank(a.label()))
            .toList();
    return new AnswerResult(
        chosen.id(),
        chosen.label(),
        chosen.correct(),
        challenge.best().id(),
        graded.total(),
        graded.reason(),
        graded.complexity(),
        graded.feedback(),
        comparison,
        left - 1);
  }

  private PatternChallenge playable(UUID userId, String id) {
    PatternChallenge challenge =
        catalog
            .pattern(id)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Challenge not found."));
    game.requireUnlocked(userId, challenge.level());
    return challenge;
  }

  private LevelContent availableLevel(int level) {
    return catalog
        .level(level)
        .filter(LevelContent::available)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Level not found."));
  }

  private int answersLeft(UUID userId, String id) {
    return Math.max(0, DAILY_LIMIT - store.countToday(userId, id, clock.instant()));
  }
}
