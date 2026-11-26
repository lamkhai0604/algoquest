package com.algoquest.grading;

/**
 * A graded design (D-085), on the System Design rubric: requirements and scope 0–20, estimation
 * 0–15, high-level design 0–25, data and scaling 0–20, trade-offs and failures 0–20. {@code
 * strengths} and {@code improve} are short feedback for the learner.
 */
public record DesignResult(
    int requirements,
    int estimation,
    int design,
    int data,
    int tradeoffs,
    String strengths,
    String improve) {

  public static final int MAX_REQUIREMENTS = 20;
  public static final int MAX_ESTIMATION = 15;
  public static final int MAX_DESIGN = 25;
  public static final int MAX_DATA = 20;
  public static final int MAX_TRADEOFFS = 20;

  public int total() {
    return requirements + estimation + design + data + tradeoffs;
  }

  /** Scores rounded and kept inside each category's range; missing feedback becomes empty. */
  static DesignResult clamped(
      double requirements,
      double estimation,
      double design,
      double data,
      double tradeoffs,
      String strengths,
      String improve) {
    return new DesignResult(
        clamp(requirements, MAX_REQUIREMENTS),
        clamp(estimation, MAX_ESTIMATION),
        clamp(design, MAX_DESIGN),
        clamp(data, MAX_DATA),
        clamp(tradeoffs, MAX_TRADEOFFS),
        strengths == null ? "" : strengths.strip(),
        improve == null ? "" : improve.strip());
  }

  static int clamp(double value, int max) {
    if (Double.isNaN(value) || Double.isInfinite(value)) {
      return 0;
    }
    return (int) Math.max(0, Math.min(max, Math.round(value)));
  }
}
