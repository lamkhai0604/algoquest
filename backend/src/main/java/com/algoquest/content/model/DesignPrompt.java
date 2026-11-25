package com.algoquest.content.model;

import java.util.List;

/**
 * A design prompt (D-085): the learner writes a short design under four scaffold headings, and the
 * AI grades it with the five-category rubric of the System Design syllabus. {@code criteria} lists
 * the task-specific points for each category; {@code fullMarkDesigns} describes at least two
 * different designs that earn full marks, so the grader does not reward one shape only. Neither is
 * sent to the learner. The {@code reference} design is shown only after a graded answer.
 */
public record DesignPrompt(
    String id,
    int level,
    String title,
    String prompt,
    List<String> facts,
    List<String> scope,
    Criteria criteria,
    List<String> fullMarkDesigns,
    Reference reference) {

  /** Task-specific points for each rubric category. */
  public record Criteria(
      List<String> requirements,
      List<String> estimation,
      List<String> design,
      List<String> data,
      List<String> tradeoffs) {}

  /** One possible design, with the assumptions it makes and the alternatives it rejected. */
  public record Reference(List<String> assumptions, String design, List<String> alternatives) {}
}
