package com.algoquest.access.signin;

import com.algoquest.access.AccessService;
import com.algoquest.access.AuthenticatedUser;
import com.algoquest.access.Permission;
import com.algoquest.access.Role;
import com.algoquest.access.Scope;
import com.algoquest.access.UserNotFoundException;
import com.algoquest.access.UserSummary;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Sign-in code exchange and the signed-in user (FR-01, D-036). */
@RestController
@RequestMapping("/api/v1")
public class AuthController {

  private final LoginCodeService loginCodes;
  private final TokenService tokens;
  private final AccessService access;

  public AuthController(LoginCodeService loginCodes, TokenService tokens, AccessService access) {
    this.loginCodes = loginCodes;
    this.tokens = tokens;
    this.access = access;
  }

  /** Trades a one-time sign-in code for the app's token. Open to unauthenticated callers. */
  @PostMapping("/auth/exchange")
  public TokenResponse exchange(@RequestBody ExchangeRequest request) {
    UUID userId = loginCodes.exchange(request == null ? null : request.code());
    TokenService.IssuedToken issued = tokens.issue(userId);
    return new TokenResponse(issued.token(), issued.expiresAt());
  }

  @GetMapping("/me")
  public MeResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
    UserSummary summary = access.findUser(user.id()).orElseThrow(UserNotFoundException::new);
    List<String> permissions =
        access.permissionsOf(user.id(), Scope.GLOBAL).stream().map(Permission::code).toList();
    return new MeResponse(
        summary.id(), summary.email(), summary.displayName(), summary.roles(), permissions);
  }

  public record ExchangeRequest(String code) {}

  public record TokenResponse(String token, Instant expiresAt) {}

  public record MeResponse(
      UUID id, String email, String displayName, List<Role> roles, List<String> permissions) {}
}
