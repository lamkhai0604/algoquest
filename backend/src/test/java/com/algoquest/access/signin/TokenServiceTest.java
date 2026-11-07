package com.algoquest.access.signin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class TokenServiceTest {

  private static final String SECRET = "test-secret-with-at-least-32-characters!";

  private final TokenService tokens = new TokenService(SECRET, Clock.systemUTC());

  @Test
  void issuedTokenVerifiesToTheSameUserAndLastsFourHours() {
    UUID userId = UUID.randomUUID();

    TokenService.IssuedToken issued = tokens.issue(userId);

    assertThat(tokens.verify(issued.token())).contains(userId);
    assertThat(Duration.between(Instant.now(), issued.expiresAt()))
        .isBetween(Duration.ofMinutes(239), Duration.ofHours(4));
  }

  @Test
  void expiredTokenIsRejected() {
    Clock fiveHoursAgo = Clock.offset(Clock.systemUTC(), Duration.ofHours(-5));
    String token = new TokenService(SECRET, fiveHoursAgo).issue(UUID.randomUUID()).token();

    assertThat(tokens.verify(token)).isEmpty();
  }

  @Test
  void tokenSignedWithAnotherKeyIsRejected() {
    String other = "another-secret-with-at-least-32-characters";
    String token = new TokenService(other, Clock.systemUTC()).issue(UUID.randomUUID()).token();

    assertThat(tokens.verify(token)).isEmpty();
  }

  @Test
  void tamperedOrMalformedTokensAreRejected() {
    String token = tokens.issue(UUID.randomUUID()).token();
    String[] parts = token.split("\\.");
    String unsigned = parts[0] + "." + parts[1] + ".";

    assertThat(tokens.verify(unsigned)).isEmpty();
    assertThat(tokens.verify(token + "x")).isEmpty();
    assertThat(tokens.verify("not-a-token")).isEmpty();
  }

  @Test
  void shortSecretIsRefusedAtStartup() {
    assertThatThrownBy(() -> new TokenService("too-short", Clock.systemUTC()))
        .isInstanceOf(IllegalStateException.class);
  }
}
