package com.algoquest.grading;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GeminiGraderTest {

  private static final String ANSWER =
      "{\\\"trace\\\":\\\"Gives 9.\\\",\\\"pattern\\\":40,\\\"steps\\\":28,"
          + "\\\"complexity\\\":20,\\\"edgeCases\\\":5,"
          + "\\\"feedback\\\":\\\"Name an edge case.\\\"}";
  private static final String OK =
      "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"" + ANSWER + "\"}]}}]}";

  private HttpServer server;
  private final AtomicReference<String> requestBody = new AtomicReference<>();
  private final AtomicReference<String> requestKey = new AtomicReference<>();
  private final AtomicReference<String> requestPath = new AtomicReference<>();
  private volatile int status = 200;
  private volatile String response = OK;
  private volatile long delayMs = 0;

  @BeforeEach
  void startServer() throws IOException {
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/",
        exchange -> {
          requestPath.set(exchange.getRequestURI().getPath());
          requestKey.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
          requestBody.set(
              new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
          try {
            Thread.sleep(delayMs);
          } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
          }
          byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
          exchange.sendResponseHeaders(status, bytes.length);
          exchange.getResponseBody().write(bytes);
          exchange.close();
        });
    server.start();
  }

  @AfterEach
  void stopServer() {
    server.stop(0);
  }

  private GeminiGrader grader(String key, Duration timeout) {
    String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
    return new GeminiGrader(baseUrl, key, "test-model", timeout);
  }

  private GradingResult grade(String explanation) {
    return grader("secret-key", Duration.ofSeconds(5))
        .grade(GradingTestData.problem(), "Big-O & Basics", explanation);
  }

  @Test
  void gradesAndSnapsTheScores() {
    GradingResult result = grade("Keep a running maximum.");

    assertThat(result).isEqualTo(new GradingResult(40, 30, 20, 5, "Name an edge case."));
    assertThat(requestPath.get()).isEqualTo("/v1beta/models/test-model:generateContent");
    assertThat(requestKey.get()).isEqualTo("secret-key");
    assertThat(requestBody.get())
        .contains("\"temperature\":0")
        .contains("\"responseMimeType\":\"application/json\"")
        .contains("strict but fair grader")
        .contains("<student_answer>\\nKeep a running maximum.\\n</student_answer>")
        .doesNotContain("secret-key");
  }

  @Test
  void quotaAndServerErrorsMakeGradingUnavailable() {
    status = 429;
    assertThatThrownBy(() -> grade("x"))
        .isInstanceOf(GraderUnavailableException.class)
        .hasMessage(GraderUnavailableException.MESSAGE)
        .extracting(e -> ((GraderUnavailableException) e).reason())
        .asString()
        .contains("429");

    status = 503;
    assertThatThrownBy(() -> grade("x")).isInstanceOf(GraderUnavailableException.class);
  }

  @Test
  void aSlowAnswerTimesOut() {
    delayMs = 1500;
    GeminiGrader grader = grader("secret-key", Duration.ofMillis(200));

    assertThatThrownBy(() -> grader.grade(GradingTestData.problem(), "Basics", "x"))
        .isInstanceOf(GraderUnavailableException.class);
  }

  @Test
  void unusableAnswersMakeGradingUnavailable() {
    response = "{\"candidates\":[]}";
    assertThatThrownBy(() -> grade("x")).isInstanceOf(GraderUnavailableException.class);

    response = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"not json\"}]}}]}";
    assertThatThrownBy(() -> grade("x")).isInstanceOf(GraderUnavailableException.class);

    response = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"pattern\\\":40}\"}]}}]}";
    assertThatThrownBy(() -> grade("x")).isInstanceOf(GraderUnavailableException.class);
  }

  @Test
  void withoutAnApiKeyNoCallIsMade() {
    GeminiGrader grader = grader(" ", Duration.ofSeconds(5));

    assertThatThrownBy(() -> grader.grade(GradingTestData.problem(), "Basics", "x"))
        .isInstanceOf(GraderUnavailableException.class);
    assertThat(requestPath.get()).isNull();
  }
}
