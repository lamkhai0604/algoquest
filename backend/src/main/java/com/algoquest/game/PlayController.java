package com.algoquest.game;

import com.algoquest.access.AuthenticatedUser;
import com.algoquest.content.ContentViews.LessonView;
import com.algoquest.content.ContentViews.ProblemView;
import com.algoquest.game.GameViews.LevelView;
import com.algoquest.game.GameViews.ProblemItem;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Level map, lesson, and problem endpoints (FR-02 to FR-04). */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasPermission(null, 'game.play')")
public class PlayController {

  private final GameService game;

  public PlayController(GameService game) {
    this.game = game;
  }

  @GetMapping("/levels")
  public List<LevelView> levels(@AuthenticationPrincipal AuthenticatedUser user) {
    return game.levels(user.id());
  }

  @GetMapping("/levels/{number}/lesson")
  public LessonView lesson(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable int number) {
    return game.lesson(user.id(), number);
  }

  @GetMapping("/levels/{number}/problems")
  public List<ProblemItem> problems(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable int number) {
    return game.problems(user.id(), number);
  }

  @GetMapping("/problems/{id}")
  public ProblemView problem(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable String id) {
    return game.problem(user.id(), id);
  }
}
