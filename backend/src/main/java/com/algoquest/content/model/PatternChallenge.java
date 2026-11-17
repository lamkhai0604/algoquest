package com.algoquest.content.model;

import java.util.List;

/**
 * A Pattern Recognition challenge (D-057): a problem that does not name its pattern, and the
 * approaches a learner may choose from. Each approach's {@code label} ({@code best}, {@code valid},
 * or {@code unsuitable}) alone decides whether choosing it is correct; the AI grades only the
 * written reason.
 */
public record PatternChallenge(
    String id,
    int level,
    String title,
    String statement,
    List<String> examples,
    List<String> constraints,
    List<Approach> approaches) {

  /** One approach a learner can choose, with how well it fits this problem and why. */
  public record Approach(
      String id,
      String name,
      String hint,
      String label,
      String time,
      String space,
      String why) {

    public boolean correct() {
      return !"unsuitable".equals(label);
    }
  }

  public Approach approach(String approachId) {
    return approaches.stream().filter(a -> a.id().equals(approachId)).findFirst().orElse(null);
  }

  public Approach best() {
    return approaches.stream().filter(a -> "best".equals(a.label())).findFirst().orElseThrow();
  }
}
