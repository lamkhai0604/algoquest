package com.algoquest.access;

import com.algoquest.shared.web.ApiException;
import org.springframework.http.HttpStatus;

/** The last Owner can never be removed (FR-17.3). */
public class LastOwnerException extends ApiException {

  public LastOwnerException() {
    super(HttpStatus.CONFLICT, "Last Owner", "The last Owner cannot be removed.");
  }
}
