package com.algoquest.access;

import com.algoquest.shared.web.ApiException;
import org.springframework.http.HttpStatus;

public class UserNotFoundException extends ApiException {

  public UserNotFoundException() {
    super(HttpStatus.NOT_FOUND, "Not Found", "User not found.");
  }
}
