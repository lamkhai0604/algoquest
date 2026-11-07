package com.algoquest.shared.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;

class ApiExceptionHandlerTest {

  private final ApiExceptionHandler handler = new ApiExceptionHandler();

  @Test
  void unexpectedErrorBecomesGeneric500WithoutInternalDetails() {
    ProblemDetail problem =
        handler.handleUnexpected(new IllegalStateException("db password is hunter2"));

    assertThat(problem.getStatus()).isEqualTo(500);
    assertThat(problem.getTitle()).isEqualTo("Internal Server Error");
    assertThat(problem.getDetail()).doesNotContain("hunter2");
    assertThat(problem.getProperties()).isNullOrEmpty();
  }
}
