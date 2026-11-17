package com.algoquest.content.model;

import java.util.List;

/**
 * Everything on file for one level. {@code lesson} is null for a level with no content yet; {@code
 * patterns} is empty when the level has no Pattern Recognition challenges.
 */
public record LevelContent(
    LevelInfo info, Lesson lesson, List<Problem> problems, List<PatternChallenge> patterns) {

  public boolean available() {
    return lesson != null;
  }
}
