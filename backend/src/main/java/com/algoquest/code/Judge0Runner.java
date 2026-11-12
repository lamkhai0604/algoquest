package com.algoquest.code;

import com.algoquest.content.model.Problem;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Runs Java on Judge0 CE through RapidAPI (D-032): one synchronous submission per run with every
 * hidden test inside. The code and the tests are sent; the player's name and email are not.
 */
public class Judge0Runner implements JavaRunner {

  /** Judge0 status IDs: 3 is Accepted, 6 is a compilation error; 4 and above 6 are failures. */
  private static final int ACCEPTED = 3;

  private static final int COMPILE_ERROR = 6;
  private static final JsonMapper JSON = JsonMapper.builder().build();

  private final RestClient http;
  private final String apiKey;
  private final int languageId;

  public Judge0Runner(String baseUrl, String apiKey, int languageId, Duration timeout) {
    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
    factory.setReadTimeout(timeout);
    String host = baseUrl.replaceFirst("^https?://", "").replaceAll("/.*$", "");
    this.http =
        RestClient.builder()
            .baseUrl(baseUrl)
            .requestFactory(factory)
            .defaultHeader("X-RapidAPI-Host", host)
            .build();
    this.apiKey = apiKey;
    this.languageId = languageId;
  }

  @Override
  public JavaRun run(Problem problem, String code) {
    if (apiKey.isBlank()) {
      throw new RunnerUnavailableException("JUDGE0_API_KEY is not set");
    }
    JavaHarness.Program program = JavaHarness.build(problem, code);
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("language_id", languageId);
    body.put("source_code", program.source());
    body.put("cpu_time_limit", 5);
    body.put("wall_time_limit", 10);
    body.put("memory_limit", 256000);
    String answer;
    try {
      answer =
          http.post()
              .uri("/submissions?base64_encoded=false&wait=true")
              .header("X-RapidAPI-Key", apiKey)
              .contentType(MediaType.APPLICATION_JSON)
              .body(body)
              .retrieve()
              .body(String.class);
    } catch (RestClientException e) {
      throw new RunnerUnavailableException("Judge0 request failed: " + e.getClass().getName(), e);
    }
    try {
      JsonNode result = JSON.readTree(answer);
      int status = result.at("/status/id").asInt(0);
      if (status == COMPILE_ERROR) {
        return new JavaRun(List.of(), result.path("compile_output").asString("").strip());
      }
      if (status == 0 || status == 1 || status == 2 || status >= 13) {
        throw new RunnerUnavailableException("Judge0 status " + status);
      }
      int tests = problem.tests().size();
      List<TestOutcome> outcomes =
          JavaHarness.outcomes(result.path("stdout").asString(""), program.marker(), tests);
      if (status != ACCEPTED) {
        // Time limit or a crash outside the tests: tests that printed nothing failed with it.
        String reason = result.at("/status/description").asString("Run failed");
        outcomes.replaceAll(o -> "did not finish".equals(o.error()) ? TestOutcome.failed(reason) : o);
      }
      return new JavaRun(outcomes, null);
    } catch (RuntimeException e) {
      if (e instanceof RunnerUnavailableException) {
        throw e;
      }
      throw new RunnerUnavailableException("Judge0 answer unreadable", e);
    }
  }
}
