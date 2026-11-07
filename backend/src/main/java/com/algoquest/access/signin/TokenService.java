package com.algoquest.access.signin;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

/** Issues and verifies the app's own HMAC-signed tokens: user ID only, valid 4 hours (D-036). */
@Service
public class TokenService {

  public static final Duration LIFETIME = Duration.ofHours(4);
  private static final String ISSUER = "algoquest";
  private static final Logger log = LoggerFactory.getLogger(TokenService.class);

  private final JwtEncoder encoder;
  private final JwtDecoder decoder;
  private final Clock clock;

  public TokenService(@Value("${algoquest.jwt-secret:}") String secret, Clock clock) {
    SecretKey key = new SecretKeySpec(keyBytes(secret), "HmacSHA256");
    this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
    this.decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    this.clock = clock;
  }

  public IssuedToken issue(UUID userId) {
    Instant now = clock.instant();
    Instant expiresAt = now.plus(LIFETIME);
    JwtClaimsSet claims =
        JwtClaimsSet.builder()
            .issuer(ISSUER)
            .subject(userId.toString())
            .issuedAt(now)
            .expiresAt(expiresAt)
            .build();
    JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
    String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    return new IssuedToken(token, expiresAt);
  }

  /** Returns the user ID of a valid, unexpired token from this app; empty for anything else. */
  public Optional<UUID> verify(String token) {
    try {
      var jwt = decoder.decode(token);
      if (!ISSUER.equals(jwt.getClaimAsString("iss"))) {
        return Optional.empty();
      }
      return Optional.of(UUID.fromString(jwt.getSubject()));
    } catch (JwtException | IllegalArgumentException e) {
      return Optional.empty();
    }
  }

  private static byte[] keyBytes(String secret) {
    if (secret == null || secret.isBlank()) {
      log.warn("JWT_SECRET is not set: using a random key, so sign-ins end when the app restarts");
      byte[] random = new byte[32];
      new SecureRandom().nextBytes(random);
      return random;
    }
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) {
      throw new IllegalStateException("JWT_SECRET must be at least 32 characters");
    }
    return bytes;
  }

  public record IssuedToken(String token, Instant expiresAt) {}
}
