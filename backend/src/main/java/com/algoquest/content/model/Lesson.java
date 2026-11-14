package com.algoquest.content.model;

import java.util.List;

/**
 * A level's lesson: Markdown parts, the walkthrough, the quick check, and the intuition question
 * asked on the Understand step (answered for no XP).
 */
public record Lesson(
    String markdown,
    List<WalkthroughStep> walkthrough,
    List<QuickCheckQuestion> quickCheck,
    QuickCheckQuestion intuition) {}
