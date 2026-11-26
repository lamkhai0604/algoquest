package com.algoquest.grading;

import java.util.Map;

/**
 * A learner's design: one text per heading of the prompt (D-085, T-699). Early prompts use the four
 * scaffold headings; prompts in the routine form use the eight steps of the design interview
 * routine. The service checks that exactly the prompt's headings are present.
 */
public record DesignAnswer(Map<String, String> sections) {

  /** The text under one heading, or an empty string when the heading is absent. */
  public String get(String section) {
    if (sections == null) {
      return "";
    }
    String text = sections.get(section);
    return text == null ? "" : text;
  }
}
