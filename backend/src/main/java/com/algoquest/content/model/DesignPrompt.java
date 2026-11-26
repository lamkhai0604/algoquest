package com.algoquest.content.model;

import java.util.List;

/**
 * A design prompt (D-085): the learner writes a design under the prompt's headings, and the AI
 * grades it with the five-category rubric of the System Design syllabus. {@code form} chooses the
 * headings: {@code scaffold} (the default) gives the four headings of early prompts;
 * {@code routine} gives the eight steps of the full design interview routine taught in Level 42
 * (T-699). {@code criteria} lists the task-specific points for each category;
 * {@code fullMarkDesigns} describes at least two different designs that earn full marks, so the
 * grader does not reward one shape only. Neither is sent to the learner. The {@code reference}
 * design is shown only after a graded answer.
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
    Reference reference,
    String form) {

  public static final String SCAFFOLD = "scaffold";
  public static final String ROUTINE = "routine";

  /** The four headings of early design prompts, in order. */
  public static final List<String> SCAFFOLD_SECTIONS =
      List.of("requirements", "estimate", "components", "failure");

  /** The eight steps of the full routine (Level 42), in order. */
  public static final List<String> ROUTINE_SECTIONS =
      List.of(
          "requirements", "estimate", "api", "data", "design", "deepdive", "failures", "summary");

  /** The prompt's form, {@code scaffold} when none is given. */
  public String formOrDefault() {
    return form == null ? SCAFFOLD : form;
  }

  /** The answer headings for this prompt, in order. */
  public List<String> sections() {
    return ROUTINE.equals(form) ? ROUTINE_SECTIONS : SCAFFOLD_SECTIONS;
  }

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
