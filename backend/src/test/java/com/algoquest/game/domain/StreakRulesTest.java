package com.algoquest.game.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.algoquest.game.domain.StreakRules.Streak;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class StreakRulesTest {

  private static final LocalDate MON = LocalDate.of(2026, 11, 9);

  @Test
  void theFirstSolveStartsAStreakOfOne() {
    assertThat(StreakRules.recordSolve(Streak.NONE, MON)).isEqualTo(new Streak(1, 1, MON));
  }

  @Test
  void consecutiveDaysAddOneAndTheSameDayAddsNothing() {
    Streak monday = StreakRules.recordSolve(Streak.NONE, MON);
    Streak again = StreakRules.recordSolve(monday, MON);
    Streak tuesday = StreakRules.recordSolve(again, MON.plusDays(1));

    assertThat(again).isEqualTo(monday);
    assertThat(tuesday).isEqualTo(new Streak(2, 2, MON.plusDays(1)));
  }

  @Test
  void aMissedDayStartsOverAndKeepsTheBest() {
    Streak three = new Streak(3, 3, MON);

    Streak afterGap = StreakRules.recordSolve(three, MON.plusDays(2));

    assertThat(afterGap).isEqualTo(new Streak(1, 3, MON.plusDays(2)));
  }

  @Test
  void theShownStreakDropsToZeroAfterAMissedDay() {
    Streak three = new Streak(3, 3, MON);

    assertThat(StreakRules.current(three, MON)).isEqualTo(3);
    assertThat(StreakRules.current(three, MON.plusDays(1))).isEqualTo(3);
    assertThat(StreakRules.current(three, MON.plusDays(2))).isZero();
    assertThat(StreakRules.current(Streak.NONE, MON)).isZero();
  }

  @Test
  void aClockMovingBackChangesNothing() {
    Streak today = new Streak(2, 5, MON);

    assertThat(StreakRules.recordSolve(today, MON.minusDays(1))).isEqualTo(today);
  }
}
