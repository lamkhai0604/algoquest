package com.algoquest.game.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class XpRulesTest {

  private static final Duration FAST = Duration.ofMinutes(5);
  private static final Duration SLOW = Duration.ofHours(2);

  @ParameterizedTest(name = "{0}, {1} min, {2} hints, code {3} -> {4} XP")
  @CsvSource({
    // difficulty, minutes, hints, code passed, expected XP
    "EASY,    5, 0, false, 25", // 20 + 5 time bonus
    "EASY,   15, 0, false, 25", // exactly at the time limit still earns the bonus
    "EASY,   16, 0, false, 20",
    "MEDIUM, 10, 0, false, 35", // 20 + 10 + 5
    "MEDIUM, 26, 0, false, 30",
    "HARD,   40, 0, false, 50", // 20 + 25 + 5
    "HARD,   41, 0, false, 45",
    "EASY,    5, 1, false, 20", // 25 x 0.8
    "MEDIUM, 30, 1, false, 24", // 30 x 0.8
    "MEDIUM, 10, 2, false, 21", // 35 x 0.6
    "HARD,   50, 3, false, 18", // 45 x 0.4
    "EASY,    5, 5, false,  0", // never below zero
    "EASY,    5, 7, false,  0",
    "EASY,    5, 0, true,  50", // code doubles
    "MEDIUM, 10, 2, true,  42",
  })
  void problemXpFollowsTheFormula(
      Difficulty difficulty, long minutes, int hints, boolean code, int expected) {
    assertThat(XpRules.problemXp(difficulty, Duration.ofMinutes(minutes), hints, code))
        .isEqualTo(expected);
  }

  @Test
  void negativeInputsAreRejected() {
    assertThatThrownBy(() -> XpRules.problemXp(Difficulty.EASY, FAST, -1, false))
        .isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> XpRules.problemXp(Difficulty.EASY, Duration.ofSeconds(-1), 0, false))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void aScoreBelow70EarnsNothing() {
    XpAward award = XpRules.award(ProblemProgress.NEW, 69, Difficulty.EASY, FAST, 0, true);

    assertThat(award.xpGained()).isZero();
    assertThat(award.after()).isEqualTo(ProblemProgress.NEW);
  }

  @Test
  void theFirstSolveEarnsProblemXp() {
    XpAward award = XpRules.award(ProblemProgress.NEW, 70, Difficulty.MEDIUM, FAST, 0, false);

    assertThat(award.xpGained()).isEqualTo(35);
    assertThat(award.after()).isEqualTo(new ProblemProgress(true, 35, false));
  }

  @Test
  void solvingAgainEarnsNothingMore() {
    ProblemProgress solved = new ProblemProgress(true, 35, false);

    XpAward award = XpRules.award(solved, 100, Difficulty.MEDIUM, FAST, 0, false);

    assertThat(award.xpGained()).isZero();
    assertThat(award.after()).isEqualTo(solved);
  }

  @Test
  void laterPassingCodeAddsTheCodeBonusOnce() {
    ProblemProgress solved = new ProblemProgress(true, 20, false);

    XpAward first = XpRules.award(solved, 90, Difficulty.EASY, SLOW, 3, true);
    XpAward second = XpRules.award(first.after(), 90, Difficulty.EASY, FAST, 0, true);

    assertThat(first.xpGained()).isEqualTo(20);
    assertThat(first.after()).isEqualTo(new ProblemProgress(true, 40, true));
    assertThat(second.xpGained()).isZero();
  }

  @Test
  void codeOnTheFirstSolveLeavesNoLaterBonus() {
    XpAward first = XpRules.award(ProblemProgress.NEW, 80, Difficulty.EASY, FAST, 0, true);
    XpAward again = XpRules.award(first.after(), 80, Difficulty.EASY, FAST, 0, true);

    assertThat(first.xpGained()).isEqualTo(50);
    assertThat(again.xpGained()).isZero();
  }

  @ParameterizedTest
  @CsvSource({"1, 100", "2, 125", "3, 150", "17, 500"})
  void levelTargetGrowsBy25(int level, int target) {
    assertThat(XpRules.levelTarget(level)).isEqualTo(target);
  }

  @Test
  void levelsStartAtOne() {
    assertThatThrownBy(() -> XpRules.levelTarget(0)).isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void difficultyLabelsMatchContentFiles() {
    assertThat(Difficulty.fromLabel("Medium")).isEqualTo(Difficulty.MEDIUM);
    assertThatThrownBy(() -> Difficulty.fromLabel("medium"))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
