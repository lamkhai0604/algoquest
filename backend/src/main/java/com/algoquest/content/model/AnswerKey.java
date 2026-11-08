package com.algoquest.content.model;

import java.util.List;

/** What a good explanation contains. Server-side only (NFR-02). */
public record AnswerKey(
    String pattern,
    List<String> keyPoints,
    String timeComplexity,
    String spaceComplexity,
    List<String> edgeCases,
    List<String> acceptableSlowerApproaches) {}
