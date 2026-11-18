package com.algoquest.content.model;

import java.util.List;

/**
 * Public learner-facing strings only. Never includes grading keys, hidden tests, or starter code.
 * Example inputs and outputs always come from canonical English problem files.
 */
public record ProblemTranslation(
    String id,
    String title,
    String statement,
    List<String> exampleExplanations,
    List<String> constraints,
    List<String> hints) {}
