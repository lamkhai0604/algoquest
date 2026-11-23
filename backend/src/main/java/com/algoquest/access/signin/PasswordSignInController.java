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
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
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
 * Sign-in with an email and password (D-073, D-075). Two accounts can sign in this way: the Owner,
 * with {@code OWNER_EMAIL} and {@code OWNER_PASSWORD}, and the shared guest account, with {@code
 * GUEST_ACCOUNT} and {@code GUEST_PASSWORD}. The passwords live only in the host's settings, never
 * in the repository or the database. After {@link #MAX_FAILURES} wrong attempts within {@link
 * #WINDOW}, every attempt is refused until the window has passed.
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
  private final List<Account> accounts = new ArrayList<>();
  private final Deque<Instant> failures = new ArrayDeque<>();

  public PasswordSignInController(
      AccessService access,
      LoginCodeService loginCodes,
      Clock clock,
      @Value("${algoquest.owner-email:}") String ownerEmail,
      @Value("${algoquest.owner-password:}") String ownerPassword,
      @Value("${algoquest.guest-email:}") String guestEmail,
      @Value("${algoquest.guest-password:}") String guestPassword) {
    this.access = access;
    this.loginCodes = loginCodes;
    this.clock = clock;
    Account owner = account("OWNER", ownerEmail, ownerPassword, "Owner");
    if (owner != null) {
      accounts.add(owner);
    }
    Account guest = account("GUEST", guestEmail, guestPassword, "Guest");
    if (guest != null) {
      if (owner != null && owner.email().equals(guest.email())) {
        LOG.warn("Guest sign-in is off: GUEST_ACCOUNT must differ from OWNER_EMAIL.");
      } else {
        accounts.add(guest);
      }
    }
  }

  /** Builds an account from its settings, or returns null and logs why when they are not usable. */
  private static Account account(String prefix, String email, String password, String name) {
    String normalized = email.trim().toLowerCase(Locale.ROOT);
    boolean usable = !normalized.isEmpty() && password.length() >= MIN_LENGTH;
    if (!password.isEmpty() && !usable) {
      String emailSetting = prefix.equals("OWNER") ? "OWNER_EMAIL" : "GUEST_ACCOUNT";
      LOG.warn(
          "{} password sign-in is off: it needs {} and a {}_PASSWORD of at least {} characters.",
          name,
          emailSetting,
          prefix,
          MIN_LENGTH);
    }
    return usable ? new Account(normalized, digest(password), name) : null;
  }

  /** Whether the sign-in page offers the password form. */
  public boolean enabled() {
    return !accounts.isEmpty();
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
    byte[] password = digest(credentials.password() == null ? "" : credentials.password());
    byte[] emailDigest = digest(email);
    // Every account is checked in full, so the time taken does not show which part was wrong.
    Account matched = null;
    for (Account account : accounts) {
      boolean emailMatches = MessageDigest.isEqual(emailDigest, digest(account.email()));
      boolean passwordMatches = MessageDigest.isEqual(password, account.passwordDigest());
      if (emailMatches && passwordMatches) {
        matched = account;
      }
    }
    if (matched == null) {
      failures.addLast(now);
      throw new ApiException(
          HttpStatus.UNAUTHORIZED, "Wrong email or password", "The email or password is wrong.");
    }
    failures.clear();
    // The guest account is shown as "Guest"; the Owner keeps whatever name it already has.
    String displayName = matched.name().equals("Guest") ? "Guest" : null;
    UUID userId =
        access.signIn(new SignInProfile("password", matched.email(), matched.email(), displayName));
    return new SignInCode(loginCodes.issue(userId));
  }

  public record Credentials(String email, String password) {}

  /** A one-time code that the frontend exchanges for a token, as after any other sign-in. */
  public record SignInCode(String code) {}

  private record Account(String email, byte[] passwordDigest, String name) {}

  private static byte[] digest(String value) {
    try {
      return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
