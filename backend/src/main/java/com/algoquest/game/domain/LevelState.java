package com.algoquest.game.domain;

/** How much of a level a player may use (FR-10.3). */
public enum LevelState {
  LOCKED,
  /** The previous level's test scored 70 to 99: only Easy problems open. */
  EASY_ONLY,
  OPEN
}
