package com.algoquest.pattern;

import com.algoquest.access.AuthenticatedUser;
import com.algoquest.pattern.PatternService.AnswerRequest;
import com.algoquest.pattern.PatternService.AnswerResult;
import com.algoquest.pattern.PatternService.ChallengeSummary;
import com.algoquest.pattern.PatternService.ChallengeView;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Pattern Recognition challenges (D-057). */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasPermission(null, 'game.play')")
public class PatternController {

  private final PatternService patterns;

  public PatternController(PatternService patterns) {
    this.patterns = patterns;
  }

  @GetMapping("/levels/{number}/patterns")
  public List<ChallengeSummary> list(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable int number) {
    return patterns.list(user.id(), number);
  }

  @GetMapping("/patterns/{id}")
  public ChallengeView view(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable String id) {
    return patterns.view(user.id(), id);
  }

  @PostMapping("/patterns/{id}/answers")
  public AnswerResult answer(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable String id,
      @RequestBody AnswerRequest request) {
    return patterns.answer(user.id(), id, request);
  }
}
