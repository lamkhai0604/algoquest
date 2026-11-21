package com.algoquest.content.model;

import java.util.List;

/**
 * The state the visualizer draws for one walkthrough step: a row of cells (array items or
 * characters), labelled markers on cells, variable values, an optional prediction asked before the
 * step is revealed, an optional swap: the indices of two cells whose values this step exchanged,
 * and optional linked-list pointers: for each cell, the index of the cell its {@code next} points
 * to, or -1 for {@code null}, and an optional tree flag: the cells are a binary tree in array
 * positions, where the children of cell i are cells 2i + 1 and 2i + 2 and an empty cell is no node
 * (D-059), and optional graph edges: pairs of cell indices that make the cells the vertices of a
 * graph, with optional arrows, visited vertices and grid positions (D-060). Everything except
 * {@code cells} is optional.
 */
public record Visual(
    List<String> cells,
    List<Marker> markers,
    List<Variable> vars,
    Prediction predict,
    List<Integer> swap,
    List<Integer> next,
    Boolean tree,
    List<List<Integer>> edges,
    Boolean directed,
    List<Integer> visited,
    List<List<Integer>> positions) {

  /** The most cells a tree may have: five levels. */
  public static final int MAX_TREE_CELLS = 31;

  /** The most vertices a graph may have. */
  public static final int MAX_GRAPH_VERTICES = 12;

  /** Graph positions are columns 0 to 6 and rows 0 to 4. */
  public static final int GRAPH_COLUMNS = 7;

  public static final int GRAPH_ROWS = 5;

  public boolean drawsTree() {
    return Boolean.TRUE.equals(tree);
  }

  public boolean drawsGraph() {
    return edges != null;
  }

  public boolean drawsDirected() {
    return Boolean.TRUE.equals(directed);
  }

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
