package com.algoquest.code;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class Judge0RunnerTest {

  private static Judge0Runner runner(String key) {
    return new Judge0Runner("https://judge0.example.test", key, 62, Duration.ofSeconds(1));
  }

  @Test
  void withoutAKeyJavaIsUnavailableAndNothingIsSent() {
    Judge0Runner runner = runner("");

    assertThat(runner.available()).isFalse();
    assertThatThrownBy(() -> runner.run(null, "class Solution {}"))
        .isInstanceOf(RunnerUnavailableException.class);
  }

  @Test
  void withAKeyJavaIsAvailable() {
    assertThat(runner("a-key").available()).isTrue();
  }
}
