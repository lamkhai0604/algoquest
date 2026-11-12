package com.algoquest.admin;

import com.algoquest.access.AuthenticatedUser;
import com.algoquest.game.GameRulesService;
import com.algoquest.game.domain.GameRules;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin: the game rules editor (FR-18.3, D-047). */
@RestController
@RequestMapping("/api/v1/admin/game-rules")
@PreAuthorize("hasPermission(null, 'admin.config.edit')")
public class AdminRulesController {

  private final GameRulesService rules;

  public AdminRulesController(GameRulesService rules) {
    this.rules = rules;
  }

  /** The rules in force and the defaults, so the page can show what changed. */
  public record RulesView(GameRules current, GameRules defaults) {}

  @GetMapping
  public RulesView get() {
    return new RulesView(rules.current(), GameRules.DEFAULTS);
  }

  @PutMapping
  public RulesView update(
      @AuthenticationPrincipal AuthenticatedUser admin, @RequestBody GameRules next) {
    return new RulesView(rules.update(admin.id(), next), GameRules.DEFAULTS);
  }
}
