package com.algoquest.design;

import com.algoquest.content.ContentCatalog;
import com.algoquest.content.model.DesignPrompt;
import com.algoquest.content.model.LevelContent;
import com.algoquest.game.GameService;
import com.algoquest.grading.DesignAnswer;
import com.algoquest.grading.DesignGrader;
import com.algoquest.grading.DesignResult;
import com.algoquest.grading.GraderUnavailableException;
import com.algoquest.shared.web.ApiException;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Design prompts (D-085). The learner writes a design under four headings; the grader scores it
 * with the five-category rubric. The reference design is sent only with a graded answer. No XP is
 * awarded in the pilot.
 */
@Service
public class DesignService {

  /** Answers per prompt per player per UTC day: protects the free grading quota. */
  static final int DAILY_LIMIT = 3;

  static final int MIN_SECTION = 10;
  static final int MAX_SECTION = 2000;

  /** The scaffold headings of early design prompts, in order. */
  static final List<String> SECTIONS = List.of("requirements", "estimate", "components", "failure");

  private static final Logger log = LoggerFactory.getLogger(DesignService.class);

  private final ContentCatalog catalog;
  private final GameService game;
  private final DesignGrader grader;
  private final DesignStore store;
  private final Clock clock;

  public DesignService(
      ContentCatalog catalog,
      GameService game,
      DesignGrader grader,
      DesignStore store,
      Clock clock) {
    this.catalog = catalog;
    this.game = game;
    this.grader = grader;
    this.store = store;
    this.clock = clock;
  }

  /** A prompt in a level's list, with this player's best total score, if any. */
  public record PromptSummary(String id, String title, Integer bestScore) {}

  /** What a player sees before answering: no criteria, no full-mark designs, no reference. */
  public record PromptView(
      String id,
      int level,
      String levelTitle,
      String title,
      String prompt,
      List<String> facts,
      List<String> scope,
      List<String> sections,
      int answersLeftToday) {}

  /** One rubric category with the points earned and the maximum. */
  public record CategoryScore(String category, int points, int max) {}

  public record AnswerResult(
      int total,
      List<CategoryScore> categories,
      String strengths,
      String improve,
      DesignPrompt.Reference reference,
      int answersLeftToday) {}

  public List<PromptSummary> list(UUID userId, int level) {
    LevelContent content =
        catalog
            .level(level)
            .filter(LevelContent::available)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Level not found."));
    game.requireUnlocked(userId, level);
    Map<String, Integer> best = store.bestScores(userId);
    return content.designs().stream()
        .map(d -> new PromptSummary(d.id(), d.title(), best.get(d.id())))
        .toList();
  }

  public PromptView view(UUID userId, String id) {
    DesignPrompt prompt = playable(userId, id);
    return new PromptView(
        prompt.id(),
        prompt.level(),
        catalog.level(prompt.level()).orElseThrow().info().title(),
        prompt.title(),
        prompt.prompt(),
        prompt.facts(),
        prompt.scope(),
        SECTIONS,
        answersLeft(userId, id));
  }

  public AnswerResult answer(UUID userId, String id, DesignAnswer request) {
    DesignPrompt prompt = playable(userId, id);
    DesignAnswer answer = cleaned(request);
    int left = answersLeft(userId, id);
    if (left <= 0) {
      throw new ApiException(
          HttpStatus.TOO_MANY_REQUESTS,
          "Daily limit reached",
          "You have answered this prompt " + DAILY_LIMIT + " times today. Try again tomorrow.");
    }
    long started = System.nanoTime();
    DesignResult graded;
    try {
      graded = grader.grade(prompt, answer);
    } catch (GraderUnavailableException e) {
      log.warn("Design grading unavailable for {}: {}", prompt.id(), e.reason());
      throw e;
    }
    int gradingMs = (int) ((System.nanoTime() - started) / 1_000_000);
    store.save(userId, prompt.id(), answer, graded, grader.name(), gradingMs, clock.instant());
    return new AnswerResult(
        graded.total(),
        List.of(
            new CategoryScore("requirements", graded.requirements(), DesignResult.MAX_REQUIREMENTS),
            new CategoryScore("estimation", graded.estimation(), DesignResult.MAX_ESTIMATION),
            new CategoryScore("design", graded.design(), DesignResult.MAX_DESIGN),
            new CategoryScore("data", graded.data(), DesignResult.MAX_DATA),
            new CategoryScore("tradeoffs", graded.tradeoffs(), DesignResult.MAX_TRADEOFFS)),
        graded.strengths(),
        graded.improve(),
        prompt.reference(),
        left - 1);
  }

  private static DesignAnswer cleaned(DesignAnswer request) {
    if (request == null) {
      throw invalid();
    }
    String[] parts = {
      request.requirements(), request.estimate(), request.components(), request.failure()
    };
    for (int i = 0; i < parts.length; i++) {
      parts[i] = parts[i] == null ? "" : parts[i].strip();
      if (parts[i].length() < MIN_SECTION || parts[i].length() > MAX_SECTION) {
        throw invalid();
      }
    }
    return new DesignAnswer(parts[0], parts[1], parts[2], parts[3]);
  }

  private static ApiException invalid() {
    return new ApiException(
        HttpStatus.BAD_REQUEST,
        "Bad Request",
        "Write every section, each between "
            + MIN_SECTION
            + " and "
            + MAX_SECTION
            + " characters.");
  }

  private DesignPrompt playable(UUID userId, String id) {
    DesignPrompt prompt =
        catalog
            .design(id)
            .orElseThrow(
                () ->
                    new ApiException(
                        HttpStatus.NOT_FOUND, "Not Found", "Design prompt not found."));
    game.requireUnlocked(userId, prompt.level());
    return prompt;
  }

  private int answersLeft(UUID userId, String id) {
    return Math.max(0, DAILY_LIMIT - store.countToday(userId, id, clock.instant()));
  }
}
