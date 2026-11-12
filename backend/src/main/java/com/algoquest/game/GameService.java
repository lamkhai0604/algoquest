package com.algoquest.game;

import com.algoquest.content.ContentCatalog;
import com.algoquest.content.ContentViews.LessonView;
import com.algoquest.content.ContentViews.ProblemView;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.QuickCheckQuestion;
import com.algoquest.game.AttemptService.AttemptResult;
import com.algoquest.game.GameViews.ActiveTime;
import com.algoquest.game.GameViews.LessonPage;
import com.algoquest.game.GameViews.LevelView;
import com.algoquest.game.GameViews.ProblemItem;
import com.algoquest.game.GameViews.ProblemPage;
import com.algoquest.game.GameViews.QuickCheckAnswers;
import com.algoquest.game.GameViews.QuickCheckResult;
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
import java.util.Set;
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
  private final TestStore tests;
  private final ProblemTimeStore times;
  private final QuickCheckStore quickChecks;
  private final AttemptStore attempts;

  public GameService(
      ContentCatalog catalog,
      ProgressStore progress,
      TestStore tests,
      ProblemTimeStore times,
      QuickCheckStore quickChecks,
      AttemptStore attempts) {
    this.catalog = catalog;
    this.progress = progress;
    this.tests = tests;
    this.times = times;
    this.quickChecks = quickChecks;
    this.attempts = attempts;
  }

  @Transactional(readOnly = true)
  public List<LevelView> levels(UUID userId) {
    Map<Integer, Integer> xpByLevel = progress.xpByLevel(userId);
    Map<String, ProblemProgress> byProblem = progress.byProblem(userId);
    Map<Integer, Integer> best = tests.bestScores(userId);
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
              LevelRules.state(number, optional(best.get(number - 1))),
              LevelRules.barXp(xp, number),
              XpRules.levelTarget(number),
              LevelRules.practiceOpen(xp, number),
              LevelRules.testOpen(xp, number),
              playable,
              solved,
              best.get(number)));
    }
    return result;
  }

  @Transactional(readOnly = true)
  public LessonPage lesson(UUID userId, int number) {
    LessonView lesson = LessonView.of(openLevel(userId, number));
    return new LessonPage(lesson, quickChecks.done(userId, number));
  }

  /**
   * Checks the quick check answers. When every answer is correct the level gets 5 XP, once
   * (D-041); answering again changes nothing.
   */
  @Transactional
  public QuickCheckResult answerQuickCheck(UUID userId, int number, QuickCheckAnswers answers) {
    LevelContent level = openLevel(userId, number);
    List<QuickCheckQuestion> questions = level.lesson().quickCheck();
    List<Integer> given = answers == null || answers.answers() == null ? List.of() : answers.answers();
    if (given.size() != questions.size()) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "Invalid answers",
          "Answer each of the " + questions.size() + " questions.");
    }
    List<Boolean> correct = new ArrayList<>();
    for (int i = 0; i < questions.size(); i++) {
      correct.add(given.get(i) != null && given.get(i) == questions.get(i).answer());
    }
    boolean allCorrect = !correct.contains(false);
    int gained = 0;
    if (allCorrect && quickChecks.complete(userId, number, XpRules.QUICK_CHECK_XP)) {
      gained = XpRules.QUICK_CHECK_XP;
    }
    int xp = progress.xpByLevel(userId).getOrDefault(number, 0);
    return new QuickCheckResult(
        correct,
        allCorrect || quickChecks.done(userId, number),
        gained,
        LevelRules.barXp(xp, number),
        XpRules.levelTarget(number));
  }

  @Transactional(readOnly = true)
  public List<ProblemItem> problems(UUID userId, int number) {
    LevelContent level = openLevel(userId, number);
    LevelState state = state(userId, number);
    Map<String, ProblemProgress> byProblem = progress.byProblem(userId);
    Set<String> done = progress.practiceDone(userId);
    Set<String> started = times.started(userId);
    List<ProblemItem> result = new ArrayList<>();
    for (Problem problem : inOrder(level)) {
      ProblemProgress mine = byProblem.getOrDefault(problem.id(), ProblemProgress.NEW);
      boolean tried = byProblem.containsKey(problem.id());
      boolean locked =
          !LevelRules.canOpen(state, Difficulty.fromLabel(problem.difficulty()))
              || !previousSolved(level, problem, byProblem);
      result.add(
          new ProblemItem(
              problem.id(),
              problem.title(),
              problem.difficulty(),
              problem.status(),
              locked,
              mine.solved(),
              mine.xpAwarded(),
              done.contains(problem.id()),
              tried,
              !tried && started.contains(problem.id())));
    }
    return result;
  }

  @Transactional(readOnly = true)
  public ProblemPage problem(UUID userId, String id) {
    Problem problem = playableProblem(userId, id);
    AttemptResult last = null;
    // A level reset removes the progress row; older attempts then stay in the log only.
    if (progress.byProblem(userId).containsKey(problem.id())) {
      int levelXp = progress.xpByLevel(userId).getOrDefault(problem.level(), 0);
      last =
          attempts
              .latest(userId, problem.id(), AttemptService.EXPLAIN)
              .map(a -> AttemptResult.of(a, levelXp, problem.level()))
              .orElse(null);
    }
    LevelContent level = catalog.level(problem.level()).orElseThrow();
    List<Problem> order = inOrder(level);
    int index = order.indexOf(problem);
    String next =
        index >= 0 && index + 1 < order.size() && order.get(index + 1).isReady()
            ? order.get(index + 1).id()
            : null;
    return new ProblemPage(
        ProblemView.of(problem), times.activeSeconds(userId, problem.id()), last, next);
  }

  /** Adds a heartbeat of working time (D-043). */
  @Transactional
  public ActiveTime beat(UUID userId, String id) {
    Problem problem = playableProblem(userId, id);
    return new ActiveTime(times.beat(userId, problem.id()));
  }

  /** Starts the problem's clock again: Start again or Retry (D-043). */
  @Transactional
  public ActiveTime restart(UUID userId, String id) {
    Problem problem = playableProblem(userId, id);
    times.restart(userId, problem.id());
    return new ActiveTime(0);
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
    LevelContent level = catalog.level(problem.level()).orElseThrow();
    if (!previousSolved(level, problem, progress.byProblem(userId))) {
      throw forbidden("Solve the problem before this one first.");
    }
    return problem;
  }

  /** The player's state for a level, from the best test score of the level before it. */
  LevelState state(UUID userId, int level) {
    if (level == 1) {
      return LevelState.OPEN;
    }
    return LevelRules.state(level, optional(tests.bestScores(userId).get(level - 1)));
  }

  private static OptionalInt optional(Integer score) {
    return score == null ? OptionalInt.empty() : OptionalInt.of(score);
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

  /** The level's practice problems in play order: Easy, Medium, Hard, then by ID. */
  private static List<Problem> inOrder(LevelContent level) {
    List<Problem> result = new ArrayList<>();
    for (Problem problem : level.problems()) {
      if (isPractice(problem)) {
        result.add(problem);
      }
    }
    result.sort(GameService::byDifficultyThenId);
    return result;
  }

  /**
   * Problems open in order (D-042): the first one is open, and each later one opens when the one
   * before it is solved.
   */
  private static boolean previousSolved(
      LevelContent level, Problem problem, Map<String, ProblemProgress> byProblem) {
    List<Problem> order = inOrder(level);
    int index = order.indexOf(problem);
    if (index <= 0) {
      return true;
    }
    String previous = order.get(index - 1).id();
    return byProblem.getOrDefault(previous, ProblemProgress.NEW).solved();
  }

  private static int byDifficultyThenId(Problem a, Problem b) {
    int byDifficulty =
        Integer.compare(
            DIFFICULTY_ORDER.indexOf(a.difficulty()), DIFFICULTY_ORDER.indexOf(b.difficulty()));
    return byDifficulty != 0 ? byDifficulty : a.id().compareTo(b.id());
  }
}
