package com.algoquest.content.model;

/**
 * One step of the lesson walkthrough (lesson part 4). {@code code} and {@code visual} are optional.
 */
public record WalkthroughStep(String title, String body, String code, Visual visual) {}
