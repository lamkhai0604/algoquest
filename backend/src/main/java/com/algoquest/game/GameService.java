package com.algoquest.game;

import com.algoquest.content.ContentCatalog;
import com.algoquest.content.ContentViews.LessonView;
import com.algoquest.content.ContentViews.ProblemView;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.Problem;
import com.algoquest.game.GameViews.LevelView;
import com.algoquest.game.GameViews.ProblemItem;
import com.algoquest.game.domain.Difficulty;
import com.algoquest.game.domain.LevelRules;
import com.algoquest.game.domain.LevelState;
import com.algoquest.game.domain.ProblemProgress;
import com.algoquest.game.domain.XpRules;
import com.algoquest.shared.web.ApiException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.OptionalInt;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Level map, lessons, and problems as one player sees them (FR-02 to FR-04). */
@Service
public class GameService {

  private static final List<String> DIFFICULTY_ORDER = List.of("Easy", "Medium", "Hard");

  private final ContentCatalog catalog;
  private final ProgressStore progress;

  public GameService(ContentCatalog catalog, ProgressStore progress) {
    this.catalog = catalog;
    this.progress = progress;
  }

  @Transactional(readOnly = true)
  public List<LevelView> levels(UUID userId) {
    Map<Integer, Integer> xpByLevel = progress.xpByLevel(userId);
    Map<String, ProblemProgress> byProblem = progress.byProblem(userId);
    List<LevelView> result = new ArrayList<>();
    for (LevelContent level : catalog.levels()) {
      int number = level.info().number();
      int xp = xpByLevel.getOrDefault(number, 0);
      int playable = 0;
      int solved = 0;
      for (Problem problem : level.problems()) {
        if (isPractice(problem) && problem.isReady()) {
          playable++;
          if (byProblem.getOrDefault(problem.id(), ProblemProgress.NEW).solved()) {
            solved++;
          }
        }
      }
      result.add(
          new LevelView(
              number,
              level.info().slug(),
              level.info().title(),
              level.info().summary(),
              level.available(),
              state(userId, number),
              LevelRules.barXp(xp, number),
              XpRules.levelTarget(number),
              LevelRules.practiceOpen(xp, number),
              LevelRules.testOpen(xp, number),
              playable,
              solved));
    }
    return result;
  }

  @Transactional(readOnly = true)
  public LessonView lesson(UUID userId, int number) {
    return LessonView.of(openLevel(userId, number));
  }

  @Transactional(readOnly = true)
  public List<ProblemItem> problems(UUID userId, int number) {
    LevelContent level = openLevel(userId, number);
    LevelState state = state(userId, number);
    Map<String, ProblemProgress> byProblem = progress.byProblem(userId);
    List<ProblemItem> result = new ArrayList<>();
    for (Problem problem : level.problems()) {
      if (isPractice(problem)) {
        ProblemProgress mine = byProblem.getOrDefault(problem.id(), ProblemProgress.NEW);
        boolean locked = !LevelRules.canOpen(state, Difficulty.fromLabel(problem.difficulty()));
        result.add(
            new ProblemItem(
                problem.id(),
                problem.title(),
                problem.difficulty(),
                problem.status(),
                locked,
                mine.solved(),
                mine.xpAwarded()));
      }
    }
    result.sort(GameService::byDifficultyThenId);
    return result;
  }

  @Transactional(readOnly = true)
  public ProblemView problem(UUID userId, String id) {
    return ProblemView.of(playableProblem(userId, id));
  }

  /**
   * The full problem (with its answer key) when this player may play it: a practice problem that is
   * ready, in a level and difficulty their level state opens.
   */
  public Problem playableProblem(UUID userId, String id) {
    Problem problem = catalog.problem(id).filter(GameService::isPractice).orElse(null);
    if (problem == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Problem not found.");
    }
    if (!problem.isReady()) {
      throw forbidden("This problem is coming in a later version.");
    }
    LevelState state = state(userId, problem.level());
    if (!LevelRules.canOpen(state, Difficulty.fromLabel(problem.difficulty()))) {
      throw forbidden("This problem is locked.");
    }
    return problem;
  }

  /**
   * The player's state for a level. Level-up tests arrive in Sprint 3; until then only level 1 is
   * open.
   */
  LevelState state(UUID userId, int level) {
    return LevelRules.state(level, OptionalInt.empty());
  }

  private LevelContent openLevel(UUID userId, int number) {
    LevelContent level = catalog.level(number).orElse(null);
    if (level == null || !level.available()) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Not Found", "This level has no content yet.");
    }
    if (state(userId, number) == LevelState.LOCKED) {
      throw forbidden("This level is locked.");
    }
    return level;
  }

  private static ApiException forbidden(String detail) {
    return new ApiException(HttpStatus.FORBIDDEN, "Forbidden", detail);
  }

  private static boolean isPractice(Problem problem) {
    return "practice".equals(problem.use());
  }

  private static int byDifficultyThenId(ProblemItem a, ProblemItem b) {
    int byDifficulty =
        Integer.compare(
            DIFFICULTY_ORDER.indexOf(a.difficulty()), DIFFICULTY_ORDER.indexOf(b.difficulty()));
    return byDifficulty != 0 ? byDifficulty : a.id().compareTo(b.id());
  }
}
