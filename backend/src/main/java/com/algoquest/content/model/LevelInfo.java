package com.algoquest.content.model;

/**
 * One entry of {@code content/levels.json}. {@code phase} is the Learning Path section: 1 Core
 * Foundations, 2 Problem-Solving Patterns, 3 Interview Mastery.
 */
public record LevelInfo(int number, String slug, String title, String summary, int phase) {}
