package com.algoquest.access.signin;

import com.algoquest.access.AccessService;
import com.algoquest.shared.web.ApiException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Demo sign-in for visitors (D-062): creates a fresh demo account and returns a one-time sign-in
 * code that the frontend exchanges like any other. Open to unauthenticated callers, with a daily
 * cap on new demo accounts.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class DemoController {

  private final AccessService access;
  private final LoginCodeService loginCodes;
  private final Clock clock;
  private final boolean enabled;
  private final int dailyLimit;

  public DemoController(
      AccessService access,
      LoginCodeService loginCodes,
      Clock clock,
      @Value("${algoquest.demo.enabled:true}") boolean enabled,
      @Value("${algoquest.demo.daily-limit:40}") int dailyLimit) {
    this.access = access;
    this.loginCodes = loginCodes;
    this.clock = clock;
    this.enabled = enabled;
    this.dailyLimit = dailyLimit;
  }

  /** Which sign-in options the frontend shows. */
  @GetMapping("/options")
  public Options options() {
    return new Options(enabled);
  }

  @PostMapping("/demo")
  public synchronized DemoCode demo() {
    if (!enabled) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Not Found", "The demo sign-in is turned off.");
    }
    Instant dayStart =
        LocalDate.now(clock.withZone(ZoneOffset.UTC)).atStartOfDay().toInstant(ZoneOffset.UTC);
    if (access.demoUsersSince(dayStart) >= dailyLimit) {
      throw new ApiException(
          HttpStatus.TOO_MANY_REQUESTS,
          "Demo limit reached",
          "Today's demo accounts are used up. Try again tomorrow, or sign in with Google or GitHub.");
    }
    UUID userId = access.createDemoUser();
    return new DemoCode(loginCodes.issue(userId));
  }

  public record Options(boolean demo) {}

  public record DemoCode(String code) {}
}
