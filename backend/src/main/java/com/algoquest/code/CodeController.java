package com.algoquest.code;

import com.algoquest.access.AuthenticatedUser;
import com.algoquest.code.CodeService.CodeResult;
import com.algoquest.code.CodeService.CodeSetup;
import com.algoquest.code.CodeService.CodeSubmission;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Code answers for double XP (FR-07). */
@RestController
@RequestMapping("/api/v1/problems/{id}/code")
@PreAuthorize("hasPermission(null, 'game.play')")
public class CodeController {

  private final CodeService code;

  public CodeController(CodeService code) {
    this.code = code;
  }

  @GetMapping
  public CodeSetup setup(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String id) {
    return code.setup(user.id(), id);
  }

  @PostMapping
  public CodeResult run(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable String id,
      @RequestBody CodeSubmission submission) {
    return code.run(user.id(), id, submission);
  }
}
