package com.algoquest.shared.web;

import org.springframework.http.HttpStatus;

/** An expected error with a status and a message that is safe to show to the user. */
public class ApiException extends RuntimeException {

  private final HttpStatus status;
  private final String title;

  public ApiException(HttpStatus status, String title, String detail) {
    super(detail);
    this.status = status;
    this.title = title;
  }

  public HttpStatus status() {
    return status;
  }

  public String title() {
    return title;
  }
}
