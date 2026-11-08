package com.algoquest.access.signin;

import com.algoquest.access.AccessService;
import com.algoquest.access.SignInProfile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * Ends the provider sign-in (D-036): finds or creates the user, then redirects the browser to the
 * frontend with a one-time code. The temporary session used during the provider redirect is
 * discarded, so no server-side sign-in state remains.
 */
@Component
public class OAuthSignInHandler
    implements AuthenticationSuccessHandler, AuthenticationFailureHandler {

  private final AccessService access;
  private final LoginCodeService loginCodes;
  private final String frontendUrl;

  public OAuthSignInHandler(
      AccessService access,
      LoginCodeService loginCodes,
      @Value("${algoquest.frontend-url}") String frontendUrl) {
    this.access = access;
    this.loginCodes = loginCodes;
    this.frontendUrl = frontendUrl;
  }

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException {
    Optional<SignInProfile> profile = Optional.empty();
    if (authentication instanceof OAuth2AuthenticationToken token) {
      String provider = token.getAuthorizedClientRegistrationId();
      profile = ProviderProfiles.from(provider, token.getPrincipal().getAttributes());
    }
    endSession(request);
    if (profile.isEmpty()) {
      response.sendRedirect(frontendUrl + "/sign-in?error=email-not-verified");
      return;
    }
    String code = loginCodes.issue(access.signIn(profile.get()));
    String encoded = URLEncoder.encode(code, StandardCharsets.UTF_8);
    response.sendRedirect(frontendUrl + "/auth/callback?code=" + encoded);
  }

  @Override
  public void onAuthenticationFailure(
      HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
      throws IOException {
    endSession(request);
    response.sendRedirect(frontendUrl + "/sign-in?error=sign-in-failed");
  }

  private static void endSession(HttpServletRequest request) {
    SecurityContextHolder.clearContext();
    HttpSession session = request.getSession(false);
    if (session != null) {
      session.invalidate();
    }
  }
}
