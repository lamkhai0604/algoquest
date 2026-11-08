package com.algoquest.game.domain;

/** The result of one graded attempt: XP gained now and the problem state afterwards. */
public record XpAward(int xpGained, ProblemProgress after) {}
