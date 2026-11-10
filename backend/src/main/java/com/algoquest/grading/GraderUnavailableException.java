package com.algoquest.grading;

import com.algoquest.shared.web.ApiException;
import org.springframework.http.HttpStatus;

/**
 * The grader failed, timed out, or ran out of quota (FR-05.5). The player sees one fixed message;
 * the cause is only logged.
 */
public class GraderUnavailableException extends ApiException {

  public static final String MESSAGE = "Grading is unavailable, try again later.";

  private final String reason;

  public GraderUnavailableException(String reason) {
    super(HttpStatus.SERVICE_UNAVAILABLE, "Grading unavailable", MESSAGE);
    this.reason = reason;
  }

  /** Why grading failed, for logs only. Never contains the player's text. */
  public String reason() {
    return reason;
  }
}
