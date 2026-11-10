package com.algoquest.grading;

import com.algoquest.content.model.Problem;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Grades with the Gemini API (D-031): temperature 0, JSON output bound to a schema, one attempt
 * within the time limit. Any failure becomes {@link GraderUnavailableException}; the API key and
 * the player's text are never logged.
 */
public class GeminiGrader implements Grader {

  static final Duration TIMEOUT = Duration.ofSeconds(20);

  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final List<String> FIELDS =
      List.of("trace", "pattern", "steps", "complexity", "edgeCases", "feedback");

  private final RestClient http;
  private final String apiKey;
  private final String model;
  private final String systemPrompt = GradingPrompt.system();

  public GeminiGrader(String baseUrl, String apiKey, String model) {
    this(baseUrl, apiKey, model, TIMEOUT);
  }

  GeminiGrader(String baseUrl, String apiKey, String model, Duration timeout) {
    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
    factory.setReadTimeout(timeout);
    this.http = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    this.apiKey = apiKey == null ? "" : apiKey.strip();
    this.model = model;
  }

  @Override
  public String name() {
    return model + "/" + GradingPrompt.VERSION;
  }

  @Override
  public GradingResult grade(Problem problem, String levelTitle, String explanation) {
    if (apiKey.isEmpty()) {
      throw new GraderUnavailableException("GEMINI_API_KEY is not set");
    }
    String body;
    try {
      body =
          http.post()
              .uri("/v1beta/models/{model}:generateContent", model)
              .header("x-goog-api-key", apiKey)
              .contentType(MediaType.APPLICATION_JSON)
              .body(JSON.writeValueAsString(request(problem, levelTitle, explanation)))
              .retrieve()
              .body(String.class);
    } catch (RestClientResponseException e) {
      throw new GraderUnavailableException("Gemini answered HTTP " + status(e.getStatusCode()));
    } catch (RestClientException e) {
      throw new GraderUnavailableException("Gemini call failed: " + e.getClass().getSimpleName());
    }
    return parse(body);
  }

  private Map<String, Object> request(Problem problem, String levelTitle, String explanation) {
    Map<String, Object> properties = new LinkedHashMap<>();
    for (String field : FIELDS) {
      boolean text = field.equals("trace") || field.equals("feedback");
      properties.put(field, Map.of("type", text ? "STRING" : "INTEGER"));
    }
    Map<String, Object> schema = new LinkedHashMap<>();
    schema.put("type", "OBJECT");
    schema.put("properties", properties);
    schema.put("required", FIELDS);
    schema.put("propertyOrdering", FIELDS);

    Map<String, Object> config = new LinkedHashMap<>();
    config.put("temperature", 0);
    config.put("responseMimeType", "application/json");
    config.put("responseSchema", schema);

    String user = GradingPrompt.user(problem, levelTitle, explanation);
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
    body.put("contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", user)))));
    body.put("generationConfig", config);
    return body;
  }

  static GradingResult parse(String responseBody) {
    try {
      JsonNode text = JSON.readTree(responseBody).at("/candidates/0/content/parts/0/text");
      if (!text.isString()) {
        throw new GraderUnavailableException("Gemini returned no text");
      }
      JsonNode scores = JSON.readTree(text.asString());
      for (String field : FIELDS) {
        if (!scores.has(field)) {
          throw new GraderUnavailableException("Gemini answer is missing " + field);
        }
      }
      return GradingResult.snapped(
          scores.get("pattern").asDouble(Double.NaN),
          scores.get("steps").asDouble(Double.NaN),
          scores.get("complexity").asDouble(Double.NaN),
          scores.get("edgeCases").asDouble(Double.NaN),
          scores.get("feedback").asString());
    } catch (JacksonException | NullPointerException e) {
      throw new GraderUnavailableException("Gemini answer was not valid JSON");
    }
  }

  private static String status(HttpStatusCode code) {
    return code.value() == 429 ? "429 (quota or rate limit)" : String.valueOf(code.value());
  }
}
