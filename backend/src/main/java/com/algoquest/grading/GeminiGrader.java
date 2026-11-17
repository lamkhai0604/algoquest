package com.algoquest.grading;

import com.algoquest.content.model.Problem;
import java.time.Duration;
import java.util.List;
import tools.jackson.databind.JsonNode;

/**
 * Grades with the Gemini API (D-031): temperature 0, JSON output bound to a schema, one attempt
 * within the time limit. Any failure becomes {@link GraderUnavailableException}; the API key and
 * the player's text are never logged.
 */
public class GeminiGrader implements Grader {

  static final Duration TIMEOUT = Duration.ofSeconds(20);

  private static final List<String> FIELDS =
      List.of("trace", "pattern", "steps", "complexity", "edgeCases", "feedback");
  private static final List<String> TEXT_FIELDS = List.of("trace", "feedback");

  private final GeminiClient gemini;
  private final String systemPrompt = GradingPrompt.system();

  public GeminiGrader(String baseUrl, String apiKey, String model) {
    this(baseUrl, apiKey, model, TIMEOUT);
  }

  GeminiGrader(String baseUrl, String apiKey, String model, Duration timeout) {
    this.gemini = new GeminiClient(baseUrl, apiKey, model, timeout);
  }

  @Override
  public String name() {
    return gemini.model() + "/" + GradingPrompt.VERSION;
  }

  @Override
  public GradingResult grade(Problem problem, String levelTitle, String explanation) {
    String user = GradingPrompt.user(problem, levelTitle, explanation);
    return parse(gemini.generate(systemPrompt, user, FIELDS, TEXT_FIELDS));
  }

  static GradingResult parse(String responseBody) {
    JsonNode scores = GeminiClient.answer(responseBody, FIELDS);
    return GradingResult.snapped(
        scores.get("pattern").asDouble(Double.NaN),
        scores.get("steps").asDouble(Double.NaN),
        scores.get("complexity").asDouble(Double.NaN),
        scores.get("edgeCases").asDouble(Double.NaN),
        scores.get("feedback").asString());
  }
}
