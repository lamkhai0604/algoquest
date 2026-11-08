package com.algoquest.access;

import com.algoquest.shared.web.ApiException;
import org.springframework.http.HttpStatus;

/** An access rule refused the action, for example granting a role the actor does not cover. */
public class AccessDeniedRuleException extends ApiException {

  public AccessDeniedRuleException(String detail) {
    super(HttpStatus.FORBIDDEN, "Forbidden", detail);
  }
}
