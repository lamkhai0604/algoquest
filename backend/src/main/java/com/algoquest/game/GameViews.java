package com.algoquest.game;

import com.algoquest.content.ContentViews.ProblemView;
import com.algoquest.game.domain.LevelState;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import java.time.Instant;

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
   * @param openedAt when the player first opened it; the time bonus is measured from here
   */
  public record ProblemPage(@JsonUnwrapped ProblemView problem, Instant openedAt) {}

  /**
   * One row of a level's problem list.
   *
   * @param status {@code ready} or {@code comingSoon}
   * @param locked true when the player's level state does not open this difficulty
   * @param practiceDone whether the problem was marked Done in the practice round
   */
  public record ProblemItem(
      String id,
      String title,
      String difficulty,
      String status,
      boolean locked,
      boolean solved,
      int xp,
      boolean practiceDone) {}
}
