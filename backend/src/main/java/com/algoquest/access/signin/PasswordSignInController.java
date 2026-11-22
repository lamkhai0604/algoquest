package com.algoquest.access.signin;

import com.algoquest.access.AccessService;
import com.algoquest.access.SignInProfile;
import com.algoquest.shared.web.ApiException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Sign-in with the owner's email and password (D-073). The password comes from the {@code
 * OWNER_PASSWORD} setting on the host and is never stored in the repository or the database. After
 * {@link #MAX_FAILURES} wrong attempts within {@link #WINDOW}, every attempt is refused until the
 * window has passed.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class PasswordSignInController {

  static final int MIN_LENGTH = 12;
  static final int MAX_FAILURES = 5;
  static final Duration WINDOW = Duration.ofMinutes(15);
  private static final Logger LOG = LoggerFactory.getLogger(PasswordSignInController.class);

  private final AccessService access;
  private final LoginCodeService loginCodes;
  private final Clock clock;
  private final String ownerEmail;
  private final byte[] passwordDigest;
  private final Deque<Instant> failures = new ArrayDeque<>();

  public PasswordSignInController(
      AccessService access,
      LoginCodeService loginCodes,
      Clock clock,
      @Value("${algoquest.owner-email:}") String ownerEmail,
      @Value("${algoquest.owner-password:}") String ownerPassword) {
    this.access = access;
    this.loginCodes = loginCodes;
    this.clock = clock;
    this.ownerEmail = ownerEmail.trim().toLowerCase(Locale.ROOT);
    boolean usable = !this.ownerEmail.isEmpty() && ownerPassword.length() >= MIN_LENGTH;
    if (!ownerPassword.isEmpty() && !usable) {
      LOG.warn(
          "Password sign-in is off: it needs OWNER_EMAIL and an OWNER_PASSWORD of at least {}"
              + " characters.",
          MIN_LENGTH);
    }
    this.passwordDigest = usable ? digest(ownerPassword) : null;
  }

  /** Whether the sign-in page offers the password form. */
  public boolean enabled() {
    return passwordDigest != null;
  }

  @PostMapping("/password")
  public synchronized SignInCode signIn(@RequestBody Credentials credentials) {
    if (!enabled()) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Password sign-in is turned off.");
    }
    Instant now = clock.instant();
    while (!failures.isEmpty() && failures.peekFirst().isBefore(now.minus(WINDOW))) {
      failures.removeFirst();
    }
    if (failures.size() >= MAX_FAILURES) {
      throw new ApiException(
          HttpStatus.TOO_MANY_REQUESTS,
          "Too many attempts",
          "Too many wrong attempts. Try again in 15 minutes.");
    }
    String email =
        credentials.email() == null ? "" : credentials.email().trim().toLowerCase(Locale.ROOT);
    String password = credentials.password() == null ? "" : credentials.password();
    // Both checks always run, and the password check takes the same time whatever it compares.
    boolean emailMatches = MessageDigest.isEqual(digest(email), digest(ownerEmail));
    boolean passwordMatches = MessageDigest.isEqual(digest(password), passwordDigest);
    if (!emailMatches || !passwordMatches) {
      failures.addLast(now);
      throw new ApiException(
          HttpStatus.UNAUTHORIZED, "Wrong email or password", "The email or password is wrong.");
    }
    failures.clear();
    UUID userId = access.signIn(new SignInProfile("password", ownerEmail, ownerEmail, null));
    return new SignInCode(loginCodes.issue(userId));
  }

  public record Credentials(String email, String password) {}

  /** A one-time code that the frontend exchanges for a token, as after any other sign-in. */
  public record SignInCode(String code) {}

  private static byte[] digest(String value) {
    try {
      return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
