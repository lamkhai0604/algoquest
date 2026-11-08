package com.algoquest.access.smoke;

import com.algoquest.access.AccessService;
import com.algoquest.access.SignInProfile;
import com.algoquest.access.signin.LoginCodeService;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test-only sign-in for the CI smoke run (T-106), which cannot use real Google or GitHub accounts.
 * It replaces only the provider step: the browser still receives a one-time code and the frontend
 * exchanges it like a real sign-in. Exists only under the {@code smoke} profile.
 */
@RestController
@Profile("smoke")
public class SmokeLoginController {

  private final AccessService access;
  private final LoginCodeService loginCodes;
  private final String frontendUrl;

  public SmokeLoginController(
      AccessService access,
      LoginCodeService loginCodes,
      @Value("${algoquest.frontend-url}") String frontendUrl) {
    this.access = access;
    this.loginCodes = loginCodes;
    this.frontendUrl = frontendUrl;
  }

  @GetMapping("/test-login")
  public void login(@RequestParam String email, HttpServletResponse response) throws IOException {
    String subject = UUID.nameUUIDFromBytes(email.getBytes(StandardCharsets.UTF_8)).toString();
    UUID userId = access.signIn(new SignInProfile("smoke", subject, email, "Smoke Tester"));
    response.sendRedirect(frontendUrl + "/auth/callback?code=" + loginCodes.issue(userId));
  }
}
