package com.algoquest.content.model;

import java.util.List;

/** Everything on file for one level. {@code lesson} is null for a level with no content yet. */
public record LevelContent(LevelInfo info, Lesson lesson, List<Problem> problems) {

  public boolean available() {
    return lesson != null;
  }
}
