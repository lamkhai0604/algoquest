package com.algoquest.access.signin;

import static org.assertj.core.api.Assertions.assertThat;

import com.algoquest.access.SignInProfile;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ProviderProfilesTest {

  @Test
  void googleProfileWithVerifiedEmail() {
    Map<String, Object> attributes =
        Map.of("sub", "g-1", "email", "a@example.com", "email_verified", true, "name", "Ann");

    assertThat(ProviderProfiles.from("google", attributes))
        .contains(new SignInProfile("google", "g-1", "a@example.com", "Ann"));
  }

  @Test
  void unverifiedEmailIsRefused() {
    Map<String, Object> attributes =
        Map.of("sub", "g-1", "email", "a@example.com", "email_verified", false);

    assertThat(ProviderProfiles.from("google", attributes)).isEmpty();
  }

  @Test
  void githubFallsBackToTheLoginName() {
    Map<String, Object> attributes =
        Map.of("id", 42, "login", "ann", "email", "a@example.com", "email_verified", true);

    assertThat(ProviderProfiles.from("github", attributes))
        .contains(new SignInProfile("github", "42", "a@example.com", "ann"));
  }

  @Test
  void unknownProviderIsRefused() {
    Map<String, Object> attributes = Map.of("email", "a@example.com", "email_verified", true);

    assertThat(ProviderProfiles.from("other", attributes)).isEmpty();
  }
}
