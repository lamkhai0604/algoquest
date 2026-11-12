package com.algoquest.game;

import com.algoquest.game.domain.GameRules;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** The rules in force, for the pages that explain them (scoring guide, timers, XP notes). */
@RestController
public class RulesController {

  private final GameRulesService rules;

  public RulesController(GameRulesService rules) {
    this.rules = rules;
  }

  @GetMapping("/api/v1/rules")
  @PreAuthorize("hasPermission(null, 'game.play')")
  public GameRules current() {
    return rules.current();
  }
}
