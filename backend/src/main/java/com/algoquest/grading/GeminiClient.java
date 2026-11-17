package com.algoquest.grading;

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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * One Gemini generateContent call with JSON output bound to a schema, temperature 0, and a time
 * limit. Shared by the explanation grader and the Pattern Recognition grader. Any failure becomes
 * {@link GraderUnavailableException}; the API key and the player's text are never logged.
 */
final class GeminiClient {

  static final JsonMapper JSON = JsonMapper.builder().build();

  private final RestClient http;
  private final String apiKey;
  private final String model;

  GeminiClient(String baseUrl, String apiKey, String model, Duration timeout) {
    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
    factory.setReadTimeout(timeout);
    this.http = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    this.apiKey = apiKey == null ? "" : apiKey.strip();
    this.model = model;
  }

  String model() {
    return model;
  }

  /**
   * Sends the prompts and returns Gemini's raw response body.
   *
   * @param fields the output fields in order; {@code textFields} are strings, the rest integers
   */
  String generate(String system, String user, List<String> fields, List<String> textFields) {
    if (apiKey.isEmpty()) {
      throw new GraderUnavailableException("GEMINI_API_KEY is not set");
    }
    try {
      return http.post()
          .uri("/v1beta/models/{model}:generateContent", model)
          .header("x-goog-api-key", apiKey)
          .contentType(MediaType.APPLICATION_JSON)
          .body(JSON.writeValueAsString(request(system, user, fields, textFields)))
          .retrieve()
          .body(String.class);
    } catch (RestClientResponseException e) {
      throw new GraderUnavailableException(
          "Gemini answered HTTP " + status(e.getStatusCode()) + errorStatus(e));
    } catch (RestClientException e) {
      throw new GraderUnavailableException("Gemini call failed: " + e.getClass().getSimpleName());
    }
  }

  private static Map<String, Object> request(
      String system, String user, List<String> fields, List<String> textFields) {
    Map<String, Object> properties = new LinkedHashMap<>();
    for (String field : fields) {
      properties.put(field, Map.of("type", textFields.contains(field) ? "STRING" : "INTEGER"));
    }
    Map<String, Object> schema = new LinkedHashMap<>();
    schema.put("type", "OBJECT");
    schema.put("properties", properties);
    schema.put("required", fields);
    schema.put("propertyOrdering", fields);

    Map<String, Object> config = new LinkedHashMap<>();
    config.put("temperature", 0);
    config.put("responseMimeType", "application/json");
    config.put("responseSchema", schema);

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", system))));
    body.put("contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", user)))));
    body.put("generationConfig", config);
    return body;
  }

  /**
   * The JSON object Gemini wrote as its answer, checked for every field.
   *
   * @throws GraderUnavailableException when there is no text, it is not JSON, or a field is missing
   */
  static JsonNode answer(String responseBody, List<String> fields) {
    try {
      JsonNode text = JSON.readTree(responseBody).at("/candidates/0/content/parts/0/text");
      if (!text.isString()) {
        throw new GraderUnavailableException("Gemini returned no text");
      }
      JsonNode answer = JSON.readTree(text.asString());
      for (String field : fields) {
        if (!answer.has(field)) {
          throw new GraderUnavailableException("Gemini answer is missing " + field);
        }
      }
      return answer;
    } catch (tools.jackson.core.JacksonException | NullPointerException e) {
      throw new GraderUnavailableException("Gemini answer was not valid JSON");
    }
  }

  /**
   * Gemini's own error code and the first words of its message (for example "INVALID_ARGUMENT: API
   * key not valid"), for logs. The body describes the request, never the player's text.
   */
  private static String errorStatus(RestClientResponseException e) {
    try {
      JsonNode error = JSON.readTree(e.getResponseBodyAsString()).path("error");
      String code = error.path("status").asString("");
      String message = error.path("message").asString("");
      if (message.length() > 80) {
        message = message.substring(0, 80) + "…";
      }
      return code.isEmpty() && message.isEmpty() ? "" : " (" + code + ": " + message + ")";
    } catch (RuntimeException ignored) {
      return "";
    }
  }

  private static String status(HttpStatusCode code) {
    return code.value() == 429 ? "429 (quota or rate limit)" : String.valueOf(code.value());
  }
}
