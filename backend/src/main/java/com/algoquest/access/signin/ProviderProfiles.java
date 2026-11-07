package com.algoquest.access.signin;

import com.algoquest.access.SignInProfile;
import java.util.Map;
import java.util.Optional;

/** Reads the sign-in profile from Google and GitHub user attributes. */
final class ProviderProfiles {

  private ProviderProfiles() {}

  /**
   * Returns the profile, or empty when the provider did not confirm a verified email. For GitHub,
   * the email attributes are added by GitHubEmailUserService.
   */
  static Optional<SignInProfile> from(String provider, Map<String, Object> attributes) {
    Object email = attributes.get("email");
    boolean verified = Boolean.TRUE.equals(attributes.get("email_verified"));
    if (!(email instanceof String address) || address.isBlank() || !verified) {
      return Optional.empty();
    }
    String subject;
    String name;
    if ("google".equals(provider)) {
      subject = String.valueOf(attributes.get("sub"));
      name = (String) attributes.get("name");
    } else if ("github".equals(provider)) {
      subject = String.valueOf(attributes.get("id"));
      Object fullName = attributes.get("name");
      name = fullName instanceof String s && !s.isBlank() ? s : (String) attributes.get("login");
    } else {
      return Optional.empty();
    }
    return Optional.of(new SignInProfile(provider, subject, address, name));
  }
}
