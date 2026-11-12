package com.algoquest.code;

import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Chooses the Java runner: Judge0 by default, the fake one for tests and the smoke run. */
@Configuration
public class CodeConfig {

  private static final Logger log = LoggerFactory.getLogger(CodeConfig.class);

  @Bean
  JavaRunner javaRunner(
      @Value("${algoquest.code.java.provider:judge0}") String provider,
      @Value("${algoquest.code.java.judge0.base-url}") String baseUrl,
      @Value("${algoquest.code.java.judge0.api-key:}") String apiKey,
      @Value("${algoquest.code.java.judge0.language-id:62}") int languageId) {
    if ("fake".equals(provider)) {
      log.warn("Using the fake Java runner: Java code is not really run");
      return new FakeJavaRunner();
    }
    if (apiKey.isBlank()) {
      log.warn("JUDGE0_API_KEY is not set: Java runs will be unavailable");
    }
    return new Judge0Runner(baseUrl, apiKey, languageId, Duration.ofSeconds(25));
  }
}
