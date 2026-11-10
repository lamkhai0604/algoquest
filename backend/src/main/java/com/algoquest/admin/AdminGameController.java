package com.algoquest.admin;

import com.algoquest.access.AccessService;
import com.algoquest.access.AuditLog;
import com.algoquest.access.AuthenticatedUser;
import com.algoquest.access.UserNotFoundException;
import com.algoquest.game.AdminGameService;
import com.algoquest.game.AdminGameService.LevelProgress;
import com.algoquest.game.AdminGameService.LoggedAttempt;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin: grading log and progress reset (FR-18.1, FR-18.2). */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminGameController {

  public record ResetRequest(int level) {}

  /** The progress before and after the reset. */
  public record ResetResult(LevelProgress before, LevelProgress after) {}

  private final AdminGameService game;
  private final AccessService access;
  private final AuditLog auditLog;

  public AdminGameController(AdminGameService game, AccessService access, AuditLog auditLog) {
    this.game = game;
    this.access = access;
    this.auditLog = auditLog;
  }

  @GetMapping("/attempts")
  @PreAuthorize("hasPermission(null, 'admin.gradingLog.view')")
  public List<LoggedAttempt> gradingLog(
      @RequestParam(required = false) String problemId,
      @RequestParam(defaultValue = "100") int limit) {
    return game.gradingLog(problemId, limit);
  }

  @PostMapping("/users/{id}/progress-reset")
  @PreAuthorize("hasPermission(null, 'admin.progress.reset')")
  @Transactional
  public ResetResult resetProgress(
      @AuthenticationPrincipal AuthenticatedUser admin,
      @PathVariable UUID id,
      @RequestBody ResetRequest request) {
    access.findUser(id).orElseThrow(UserNotFoundException::new);
    LevelProgress before = game.resetLevel(id, request.level());
    LevelProgress after = game.levelProgress(id, request.level());
    auditLog.record(
        admin.id(),
        "progress.reset",
        "user:" + id,
        AdminGameService.auditValues(before),
        AdminGameService.auditValues(after));
    return new ResetResult(before, after);
  }
}
