package com.algoquest.design;

import com.algoquest.access.AuthenticatedUser;
import com.algoquest.design.DesignService.AnswerResult;
import com.algoquest.design.DesignService.PromptSummary;
import com.algoquest.design.DesignService.PromptView;
import com.algoquest.grading.DesignAnswer;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Design prompts (D-085). */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasPermission(null, 'game.play')")
public class DesignController {

  private final DesignService designs;

  public DesignController(DesignService designs) {
    this.designs = designs;
  }

  @GetMapping("/levels/{number}/designs")
  public List<PromptSummary> list(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable int number) {
    return designs.list(user.id(), number);
  }

  @GetMapping("/designs/{id}")
  public PromptView view(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String id) {
    return designs.view(user.id(), id);
  }

  @PostMapping("/designs/{id}/answers")
  public AnswerResult answer(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable String id,
      @RequestBody DesignAnswer answer) {
    return designs.answer(user.id(), id, answer);
  }
}
