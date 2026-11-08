package com.algoquest.game.domain;

/**
 * A player's state on one problem.
 *
 * @param solved whether an explanation has scored at least the pass score
 * @param xpAwarded XP already given for this problem, including any code bonus
 * @param codeBonusAwarded whether the code bonus has been given
 */
public record ProblemProgress(boolean solved, int xpAwarded, boolean codeBonusAwarded) {

  public static final ProblemProgress NEW = new ProblemProgress(false, 0, false);
}
