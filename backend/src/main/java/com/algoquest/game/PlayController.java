package com.algoquest.game;

import com.algoquest.access.AuthenticatedUser;
import com.algoquest.content.ContentViews.LessonView;
import com.algoquest.game.AttemptService.AttemptRequest;
import com.algoquest.game.AttemptService.AttemptResult;
import com.algoquest.game.GameViews.LevelView;
import com.algoquest.game.GameViews.ProblemItem;
import com.algoquest.game.GameViews.ProblemPage;
import com.algoquest.game.HintService.Hints;
import com.algoquest.game.HintService.Quota;
import com.algoquest.game.ProfileService.Profile;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Level map, lesson, problem, attempt, hint, and profile endpoints (FR-02 to FR-13). */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasPermission(null, 'game.play')")
public class PlayController {

  private final GameService game;
  private final AttemptService attempts;
  private final HintService hints;
  private final ProfileService profiles;

  public PlayController(
      GameService game, AttemptService attempts, HintService hints, ProfileService profiles) {
    this.game = game;
    this.attempts = attempts;
    this.hints = hints;
    this.profiles = profiles;
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
  public ProblemPage problem(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable String id) {
    return game.problem(user.id(), id);
  }

  @PostMapping("/problems/{id}/attempts")
  public AttemptResult attempt(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable String id,
      @RequestBody AttemptRequest request,
      HttpServletRequest http) {
    return attempts.submit(user.id(), id, request, PlayerZone.of(http));
  }

  @GetMapping("/profile")
  public Profile profile(@AuthenticationPrincipal AuthenticatedUser user, HttpServletRequest http) {
    return profiles.profile(user.id(), PlayerZone.of(http));
  }

  @GetMapping("/problems/{id}/hints")
  public Hints openedHints(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable String id) {
    return hints.opened(user.id(), id);
  }

  @PostMapping("/problems/{id}/hints")
  public Hints openHint(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String id) {
    return hints.openNext(user.id(), id);
  }

  @GetMapping("/hints/quota")
  public Quota hintQuota(@AuthenticationPrincipal AuthenticatedUser user) {
    return hints.quota(user.id());
  }
}
