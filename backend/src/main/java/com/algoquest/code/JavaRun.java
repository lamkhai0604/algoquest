package com.algoquest.code;

import java.util.List;

/**
 * The result of running Java code against every hidden test in one submission.
 *
 * @param outcomes one entry per test, in order; empty when the code did not compile
 * @param compileError the compiler message, or null
 */
public record JavaRun(List<TestOutcome> outcomes, String compileError) {}
