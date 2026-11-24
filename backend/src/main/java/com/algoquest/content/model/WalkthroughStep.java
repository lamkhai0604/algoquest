package com.algoquest.content.model;

import java.util.List;

/**
 * One step of the lesson walkthrough (lesson part 4). {@code code} and {@code visual} are optional.
 * {@code lines}, also optional, is the first and last line (counted from 1) of the code this step
 * runs: the code panel shows the step's own code, or the latest code of an earlier step, with those
 * lines lit (D-077).
 */
public record WalkthroughStep(
    String title, String body, String code, List<Integer> lines, Visual visual) {}
