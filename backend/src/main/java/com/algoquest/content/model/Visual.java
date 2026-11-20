package com.algoquest.content.model;

import java.util.List;

/**
 * The state the visualizer draws for one walkthrough step: a row of cells (array items or
 * characters), labelled markers on cells, variable values, an optional prediction asked before the
 * step is revealed, an optional swap: the indices of two cells whose values this step exchanged,
 * and optional linked-list pointers: for each cell, the index of the cell its {@code next} points
 * to, or -1 for {@code null}. Everything except {@code cells} is optional.
 */
public record Visual(
    List<String> cells,
    List<Marker> markers,
    List<Variable> vars,
    Prediction predict,
    List<Integer> swap,
    List<Integer> next) {

  /** A label drawn on one cell, such as {@code i} for the current index. */
  public record Marker(int index, String label) {}

  /** A variable and its value after the step. */
  public record Variable(String name, String value) {}

  /**
   * A question the learner answers before the step is shown. The step text and the variables named
   * in {@code hides} stay hidden until the learner answers or asks to see the answer.
   */
  public record Prediction(
      String question, List<String> options, int answer, String explanation, List<String> hides) {}
}
