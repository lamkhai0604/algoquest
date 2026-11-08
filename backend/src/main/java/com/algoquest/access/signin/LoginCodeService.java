package com.algoquest.access.signin;

import com.algoquest.shared.web.ApiException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * One-time sign-in codes (D-036). After the provider sign-in, the browser receives a code instead
 * of a token, so the token never appears in a URL. A code is valid for 60 seconds and works once.
 */
@Service
public class LoginCodeService {

  public static final Duration VALIDITY = Duration.ofSeconds(60);

  private final JdbcTemplate jdbc;
  private final Clock clock;
  private final SecureRandom random = new SecureRandom();

  public LoginCodeService(JdbcTemplate jdbc, Clock clock) {
    this.jdbc = jdbc;
    this.clock = clock;
  }

  @Transactional
  public String issue(UUID userId) {
    Instant now = clock.instant();
    jdbc.update("delete from login_code where expires_at < ?", Timestamp.from(now));
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    String code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    jdbc.update(
        "insert into login_code (id, code_hash, user_id, expires_at) values (?, ?, ?, ?)",
        UUID.randomUUID(),
        hash(code),
        userId,
        Timestamp.from(now.plus(VALIDITY)));
    return code;
  }

  /** Returns the user of a valid code and marks the code as used. */
  @Transactional
  public UUID exchange(String code) {
    if (code == null || code.isBlank()) {
      throw invalid();
    }
    Timestamp now = Timestamp.from(clock.instant());
    List<UUID> users =
        jdbc.queryForList(
            "update login_code set used_at = ? where code_hash = ? and used_at is null"
                + " and expires_at > ? returning user_id",
            UUID.class,
            now,
            hash(code),
            now);
    if (users.isEmpty()) {
      throw invalid();
    }
    return users.get(0);
  }

  private static ApiException invalid() {
    return new ApiException(
        HttpStatus.BAD_REQUEST, "Invalid sign-in code", "The sign-in link expired. Sign in again.");
  }

  static String hash(String code) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(code.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
