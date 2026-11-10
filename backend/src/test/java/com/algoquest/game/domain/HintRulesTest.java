package com.algoquest.game.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class HintRulesTest {

  private static final Instant NOW = Instant.parse("2026-11-09T12:00:00Z");

  private static Instant hoursAgo(double hours) {
    return NOW.minus(Duration.ofMinutes((long) (hours * 60)));
  }

  @Test
  void aNewPlayerHasThreeHints() {
    assertThat(HintRules.remaining(List.of(), NOW)).isEqualTo(3);
    assertThat(HintRules.nextRefill(List.of(), NOW)).isEmpty();
  }

  @Test
  void hintsInTheLastFiveHoursCount() {
    List<Instant> opened = List.of(hoursAgo(1), hoursAgo(2), hoursAgo(4.5));

    assertThat(HintRules.remaining(opened, NOW)).isZero();
    assertThat(HintRules.nextRefill(opened, NOW)).contains(hoursAgo(4.5).plus(HintRules.WINDOW));
  }

  @Test
  void aHintComesBackFiveHoursAfterItWasOpened() {
    List<Instant> opened = List.of(hoursAgo(5), hoursAgo(6), hoursAgo(1));

    assertThat(HintRules.remaining(opened, NOW)).isEqualTo(2);
    assertThat(HintRules.nextRefill(opened, NOW)).contains(hoursAgo(1).plus(HintRules.WINDOW));
  }
}
