package com.algoquest.content.model;

import java.util.List;

/** A hidden test: arguments and the expected result. Server-side only (NFR-02, D-035). */
public record TestCase(List<Object> input, Object expected) {}
