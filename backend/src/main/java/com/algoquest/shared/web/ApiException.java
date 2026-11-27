package com.algoquest.shared.web;

import java.util.Map;
import org.springframework.http.HttpStatus;

/** An expected error with a status and a message that is safe to show to the user. */
public class ApiException extends RuntimeException {

  private final HttpStatus status;
  private final String title;
  private final Map<String, Object> properties;

  public ApiException(HttpStatus status, String title, String detail) {
    this(status, title, detail, Map.of());
  }

  /** Optional safe, structured fields for client recovery actions. */
  public ApiException(
      HttpStatus status, String title, String detail, Map<String, Object> properties) {
    super(detail);
    this.status = status;
    this.title = title;
    this.properties = Map.copyOf(properties);
  }

  public HttpStatus status() {
    return status;
  }

  public String title() {
    return title;
  }

  public Map<String, Object> properties() {
    return properties;
  }
}
