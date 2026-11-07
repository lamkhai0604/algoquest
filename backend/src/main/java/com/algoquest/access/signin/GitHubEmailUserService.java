package com.algoquest.access.signin;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.client.RestClient;

/**
 * Loads a GitHub user and adds their primary verified email, which GitHub leaves out of the profile
 * when the email is private.
 */
public class GitHubEmailUserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

  private static final ParameterizedTypeReference<List<Map<String, Object>>> EMAILS =
      new ParameterizedTypeReference<>() {};

  private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
  private final RestClient github;

  public GitHubEmailUserService(RestClient github) {
    this.github = github;
  }

  @Override
  public OAuth2User loadUser(OAuth2UserRequest request) {
    OAuth2User user = delegate.loadUser(request);
    if (!"github".equals(request.getClientRegistration().getRegistrationId())) {
      return user;
    }
    Map<String, Object> attributes = new HashMap<>(user.getAttributes());
    attributes.put("email_verified", false);
    List<Map<String, Object>> emails =
        github
            .get()
            .uri("/user/emails")
            .header("Authorization", "Bearer " + request.getAccessToken().getTokenValue())
            .retrieve()
            .body(EMAILS);
    for (Map<String, Object> email : emails == null ? List.<Map<String, Object>>of() : emails) {
      if (Boolean.TRUE.equals(email.get("primary")) && Boolean.TRUE.equals(email.get("verified"))) {
        attributes.put("email", email.get("email"));
        attributes.put("email_verified", true);
      }
    }
    return new DefaultOAuth2User(user.getAuthorities(), attributes, "id");
  }
}
