package com.algoquest.game.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.OptionalInt;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class LevelRulesTest {

  @Test
  void levelOneIsAlwaysOpen() {
    assertThat(LevelRules.state(1, OptionalInt.empty())).isEqualTo(LevelState.OPEN);
  }

  @ParameterizedTest(name = "best previous test score {0} -> {1}")
  @CsvSource({"0, LOCKED", "69, LOCKED", "70, EASY_ONLY", "99, EASY_ONLY", "100, OPEN"})
  void laterLevelsFollowTheBestPreviousTestScore(int best, LevelState expected) {
    assertThat(LevelRules.state(4, OptionalInt.of(best))).isEqualTo(expected);
  }

  @Test
  void aLevelWithNoPreviousTestIsLocked() {
    assertThat(LevelRules.state(2, OptionalInt.empty())).isEqualTo(LevelState.LOCKED);
  }

  @Test
  void easyOnlyOpensOnlyEasyProblems() {
    assertThat(LevelRules.canOpen(LevelState.EASY_ONLY, Difficulty.EASY)).isTrue();
    assertThat(LevelRules.canOpen(LevelState.EASY_ONLY, Difficulty.MEDIUM)).isFalse();
    assertThat(LevelRules.canOpen(LevelState.OPEN, Difficulty.HARD)).isTrue();
    assertThat(LevelRules.canOpen(LevelState.LOCKED, Difficulty.EASY)).isFalse();
  }

  @ParameterizedTest(name = "level {1} with {0} XP: practice {2}, test {3}")
  @CsvSource({
    "0,   1, false, false",
    "69,  1, false, false",
    "70,  1, true,  false", // 70% of 100
    "99,  1, true,  false",
    "100, 1, true,  true",
    "87,  2, false, false", // 70% of 125 is 87.5
    "88,  2, true,  false",
    "125, 2, true,  true",
  })
  void practiceOpensAt70PercentAndTestAtAFullBar(int xp, int level, boolean practice, boolean test) {
    assertThat(LevelRules.practiceOpen(xp, level)).isEqualTo(practice);
    assertThat(LevelRules.testOpen(xp, level)).isEqualTo(test);
  }

  @Test
  void theBarNeverShowsMoreThanTheTarget() {
    assertThat(LevelRules.barXp(130, 1)).isEqualTo(100);
    assertThat(LevelRules.barXp(40, 1)).isEqualTo(40);
  }

  @ParameterizedTest(name = "{0} XP on level 1: Done adds {1}")
  @CsvSource({"70, 10", "95, 5", "100, 0", "120, 0"})
  void practiceDoneAddsTenUntilTheBarIsFull(int xp, int added) {
    assertThat(LevelRules.practiceDoneXp(xp, 1)).isEqualTo(added);
  }

  @Test
  void testScoreIsTheAverageRoundedDownWithUnansweredAsZero() {
    assertThat(LevelRules.testScore(List.of(100, 100, 100))).isEqualTo(100);
    assertThat(LevelRules.testScore(List.of(100, 100, 99))).isEqualTo(99);
    assertThat(LevelRules.testScore(List.of(70, 70, 71))).isEqualTo(70);
    assertThat(LevelRules.testScore(List.of(100, 100))).isEqualTo(66);
    assertThat(LevelRules.testScore(List.of())).isZero();
  }

  @Test
  void testScoreRejectsInvalidTotals() {
    assertThatThrownBy(() -> LevelRules.testScore(List.of(101)))
        .isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> LevelRules.testScore(List.of(1, 2, 3, 4)))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void totalXpIsTheSumOfLevels() {
    assertThat(LevelRules.totalXp(List.of(100, 30, 0))).isEqualTo(130);
  }
}
