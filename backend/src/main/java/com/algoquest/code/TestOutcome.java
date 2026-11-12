package com.algoquest.code;

import tools.jackson.databind.JsonNode;

/**
 * What one hidden test produced: the returned value as JSON, or an error.
 *
 * @param output the value returned, or null when the run failed
 * @param error a short error such as "ArrayIndexOutOfBoundsException", or null
 */
public record TestOutcome(JsonNode output, String error) {

  public static TestOutcome of(JsonNode output) {
    return new TestOutcome(output, null);
  }

  public static TestOutcome failed(String error) {
    return new TestOutcome(null, error);
  }
}
