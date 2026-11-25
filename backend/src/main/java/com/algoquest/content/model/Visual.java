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
 * graph, with optional arrows, visited vertices and grid positions (D-060), plus the edges this
 * step travels, the queue as vertex indices, and each vertex's ring (its distance, or -1) for
 * animation (D-061), and an optional window: the first and last index of a range of cells to shade
 * (D-063), an optional stack drawn as a strip, bottom first (D-065), and an explore flag that makes
 * a graph step interactive (D-064), and optional intervals: one {@code [start, end]} per cell,
 * drawn as bars on a shared time axis, with the indexes of kept intervals and a sweep line (D-066),
 * and an optional table layout: the cells in {@code rows} rows with row and column labels and the
 * indexes of the cells a step reads (D-068), and optional edge weights, one label per edge (D-069),
 * and optional recursive calls drawn as a staircase, one box per call indented by its depth
 * (D-078), and an optional architecture diagram drawn in 3D: components on a floor grid, links
 * between them, and the path one request travels in this step (D-079). Everything except {@code
 * cells} is optional.
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
    List<List<Integer>> positions,
    List<List<Integer>> activeEdges,
    List<Integer> queue,
    List<Integer> rings,
    List<Integer> window,
    List<String> stack,
    Boolean explore,
    List<List<Integer>> intervals,
    List<Integer> chosen,
    Integer line,
    Integer rows,
    List<String> rowLabels,
    List<String> columnLabels,
    List<Integer> reads,
    List<String> weights,
    List<Call> calls,
    Architecture arch) {

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

  public boolean drawsIntervals() {
    return intervals != null;
  }

  public boolean drawsTable() {
    return rows != null;
  }

  public boolean explores() {
    return Boolean.TRUE.equals(explore);
  }

  public boolean drawsDirected() {
    return Boolean.TRUE.equals(directed);
  }

  /** A label drawn on one cell, such as {@code i} for the current index. */
  public record Marker(int index, String label) {}

  /**
   * One recursive call in the staircase (D-078): its text, how deep it is (0 for the first call),
   * its state ({@code active}, {@code waiting} for a call it made, or {@code done}), and what it
   * returned, if anything yet.
   */
  public record Call(String text, int depth, String state, String result) {}

  /** The most calls a staircase may show. */
  public static final int MAX_CALLS = 16;

  /** Calls are indented at most this deep. */
  public static final int MAX_CALL_DEPTH = 6;

  /**
   * A system design diagram (D-079): components placed on a floor grid, the links between them, and
   * the components one request passes through in this step, in order. The request travels along the
   * path and back; with {@code drop} it is lost at the last component instead.
   */
  public record Architecture(
      List<Component> nodes, List<List<Integer>> links, List<Integer> path, Boolean drop) {

    public boolean drops() {
      return Boolean.TRUE.equals(drop);
    }
  }

  /**
   * One component: its kind (which shape is drawn), a short label, its place on the floor grid, and
   * an optional state, {@code hot} for overloaded or {@code down} for failed.
   */
  public record Component(String kind, String label, int x, int y, String state) {}

  /** The kinds of component an architecture diagram can draw. */
  public static final java.util.Set<String> COMPONENT_KINDS =
      java.util.Set.of("client", "dns", "cdn", "lb", "server", "cache", "db", "queue");

  /** The most components a diagram may have. */
  public static final int MAX_COMPONENTS = 10;

  /** Floor positions are columns 0 to 10 and rows 0 to 8. */
  public static final int ARCH_COLUMNS = 11;

  public static final int ARCH_ROWS = 9;

  /** The longest component label. */
  public static final int MAX_COMPONENT_LABEL = 16;

  /** A variable and its value after the step. */
  public record Variable(String name, String value) {}

  /**
   * A question the learner answers before the step is shown. The step text and the variables named
   * in {@code hides} stay hidden until the learner answers or asks to see the answer.
   */
  public record Prediction(
      String question, List<String> options, int answer, String explanation, List<String> hides) {}
}
