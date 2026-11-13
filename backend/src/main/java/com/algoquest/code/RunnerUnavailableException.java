package com.algoquest.code;

/** The code runner could not run the code (network, quota, or provider error). */
public class RunnerUnavailableException extends RuntimeException {

  public RunnerUnavailableException(String reason) {
    super(reason);
  }

  public RunnerUnavailableException(String reason, Throwable cause) {
    super(reason, cause);
  }
}
