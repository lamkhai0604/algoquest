package com.algoquest.content.model;

import java.util.List;

/** A level's lesson: Markdown parts plus the walkthrough and quick check. */
public record Lesson(
    String markdown, List<WalkthroughStep> walkthrough, List<QuickCheckQuestion> quickCheck) {}
