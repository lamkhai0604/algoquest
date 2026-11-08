package com.algoquest.content.model;

/** One step of the lesson walkthrough (lesson part 4). {@code code} is optional. */
public record WalkthroughStep(String title, String body, String code) {}
