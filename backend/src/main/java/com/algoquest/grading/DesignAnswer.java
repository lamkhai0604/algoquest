package com.algoquest.grading;

/**
 * A learner's design under the four scaffold headings of early design prompts (D-085):
 * requirements, one estimate, components, and one failure or trade-off.
 */
public record DesignAnswer(
    String requirements, String estimate, String components, String failure) {}
