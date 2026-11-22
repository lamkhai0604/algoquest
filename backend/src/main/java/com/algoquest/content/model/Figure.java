package com.algoquest.content.model;

import java.util.List;

/**
 * A picture inside lesson.md, written as a {@code ```figure} block of JSON (D-072). Stack, queue
 * and visual figures are a row of frames, one operation per frame; an image figure shows a decorative
 * picture from the frontend's lesson-images folder.
 */
public record Figure(String kind, String caption, List<Frame> frames, String src, String alt) {

  /**
   * One frame: the operation that led to it, the items (stack bottom first, queue front first), an
   * item that left in this frame, or a walkthrough-style visual (array, list, tree, graph).
   */
  public record Frame(String op, List<String> items, String out, Visual visual) {}
}
