package com.algoquest.content.model;

import java.util.List;

/** A multiple-choice question of the lesson quick check (lesson part 9). */
public record QuickCheckQuestion(
    String question, List<String> options, int answer, String explanation) {}
