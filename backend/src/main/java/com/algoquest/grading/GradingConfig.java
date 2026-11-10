package com.algoquest.grading;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Chooses the grader: Gemini by default, the fake one for tests and the smoke run. */
@Configuration
public class GradingConfig {

  private static final Logger log = LoggerFactory.getLogger(GradingConfig.class);

  @Bean
  Grader grader(
      @Value("${algoquest.grading.provider:gemini}") String provider,
      @Value("${algoquest.grading.gemini.base-url}") String baseUrl,
      @Value("${algoquest.grading.gemini.api-key:}") String apiKey,
      @Value("${algoquest.grading.gemini.model}") String model) {
    if ("fake".equals(provider)) {
      log.warn("Using the fake grader: explanations are not really graded");
      return new FakeGrader();
    }
    if (apiKey.isBlank()) {
      log.warn("GEMINI_API_KEY is not set: grading will be unavailable");
    }
    return new GeminiGrader(baseUrl, apiKey, model);
  }
}
