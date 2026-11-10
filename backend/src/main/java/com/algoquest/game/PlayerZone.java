package com.algoquest.game;

import jakarta.servlet.http.HttpServletRequest;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * The player's time zone, sent by the app in the {@code X-Time-Zone} header (an IANA name such as
 * America/Los_Angeles). Days fall back to UTC when the header is missing or invalid.
 */
public final class PlayerZone {

  public static final String HEADER = "X-Time-Zone";

  private PlayerZone() {}

  public static ZoneId of(HttpServletRequest request) {
    String value = request == null ? null : request.getHeader(HEADER);
    if (value == null || value.isBlank() || value.length() > 64) {
      return ZoneOffset.UTC;
    }
    try {
      return ZoneId.of(value.strip());
    } catch (DateTimeException e) {
      return ZoneOffset.UTC;
    }
  }
}
