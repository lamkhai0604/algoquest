package com.algoquest.content;

import java.util.List;

/** Content on file is invalid. Thrown at startup, so the app never runs with broken content. */
public class ContentException extends RuntimeException {

  private final List<String> problems;

  public ContentException(List<String> problems) {
    super("Invalid content (" + problems.size() + "):\n  " + String.join("\n  ", problems));
    this.problems = List.copyOf(problems);
  }

  public List<String> problems() {
    return problems;
  }
}
