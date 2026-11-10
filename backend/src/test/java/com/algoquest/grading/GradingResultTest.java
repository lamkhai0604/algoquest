package com.algoquest.grading;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class GradingResultTest {

  @Test
  void scoresSnapToTheNearestAllowedValue() {
    GradingResult result = GradingResult.snapped(35, 14, 11, 9, "  ok  ");

    assertThat(result).isEqualTo(new GradingResult(40, 15, 10, 10, "ok"));
    assertThat(result.total()).isEqualTo(75);
  }

  @Test
  void outOfRangeAndInvalidScoresStayOnTheGrid() {
    GradingResult result = GradingResult.snapped(1000, -5, Double.NaN, 2.4, null);

    assertThat(result).isEqualTo(new GradingResult(40, 0, 0, 0, ""));
  }
}
