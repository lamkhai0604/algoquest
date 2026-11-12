package com.algoquest.game;

import com.algoquest.content.ContentViews.LessonView;
import com.algoquest.content.ContentViews.ProblemView;
import com.algoquest.game.domain.LevelState;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import java.util.List;

/** What the API returns about a player's levels and problems. */
public final class GameViews {

  private GameViews() {}

  /**
   * One level on the map.
   *
   * @param available whether the level has content in this release
   * @param xp XP shown on the bar, never more than {@code target}
   * @param problems number of playable practice problems
   * @param solved how many of them the player has solved
   * @param bestTestScore the best level-up test score, or null before the first test
   */
  public record LevelView(
      int number,
      String slug,
      String title,
      String summary,
      boolean available,
      LevelState state,
      int xp,
      int target,
      boolean practiceOpen,
      boolean testOpen,
      int problems,
      int solved,
      Integer bestTestScore) {}

  /**
   * A problem as the solve page shows it.
   *
   * @param activeSeconds active working time so far, the clock of the time bonus (D-043)
   * @param lastResult the latest graded explanation, or null before the first one (D-042)
   * @param nextProblemId the next problem in the level's order, or null after the last one
   */
  public record ProblemPage(
      @JsonUnwrapped ProblemView problem,
      int activeSeconds,
      AttemptService.AttemptResult lastResult,
      String nextProblemId) {}

  /** A lesson and whether this player has finished its quick check (D-041). */
  public record LessonPage(@JsonUnwrapped LessonView lesson, boolean quickCheckDone) {}

  /** The answer to a quick check: the chosen option per question, in order. */
  public record QuickCheckAnswers(List<Integer> answers) {}

  /**
   * The result of a quick check.
   *
   * @param correct one entry per question
   * @param done true when every answer is correct (now or before)
   * @param xpGained XP added by this answer: 5 the first time it is all correct, else 0
   */
  public record QuickCheckResult(
      List<Boolean> correct, boolean done, int xpGained, int levelXp, int levelTarget) {}

  /** Active working time after a heartbeat or a restart. */
  public record ActiveTime(int activeSeconds) {}

  /**
   * One row of a level's problem list.
   *
   * @param status {@code ready} or {@code comingSoon}
   * @param locked true when the player's level state does not open this difficulty, or the problem
   *     before it in the level is not solved yet (D-042)
   * @param practiceDone whether the problem was marked Done in the practice round
   * @param tried whether the problem has a graded explanation
   * @param paused whether the player has working time on it and no graded explanation yet
   */
  public record ProblemItem(
      String id,
      String title,
      String difficulty,
      String status,
      boolean locked,
      boolean solved,
      int xp,
      boolean practiceDone,
      boolean tried,
      boolean paused) {}
}
