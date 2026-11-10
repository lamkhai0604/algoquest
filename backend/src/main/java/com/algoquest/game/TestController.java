package com.algoquest.game;

import com.algoquest.access.AuthenticatedUser;
import com.algoquest.game.TestService.AnswerRequest;
import com.algoquest.game.TestService.TestView;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Level-up test endpoints (FR-10). */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasPermission(null, 'game.play')")
public class TestController {

  private final TestService tests;

  public TestController(TestService tests) {
    this.tests = tests;
  }

  @PostMapping("/levels/{number}/tests")
  public TestView start(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable int number) {
    return tests.start(user.id(), number);
  }

  @GetMapping("/tests/{id}")
  public TestView get(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    return tests.get(user.id(), id);
  }

  @PostMapping("/tests/{id}/answers")
  public TestView answer(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @RequestBody AnswerRequest request) {
    return tests.saveAnswer(user.id(), id, request);
  }

  @PostMapping("/tests/{id}/submit")
  public TestView submit(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    return tests.submit(user.id(), id);
  }
}
