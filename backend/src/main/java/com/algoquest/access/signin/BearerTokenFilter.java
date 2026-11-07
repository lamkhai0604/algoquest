package com.algoquest.access.signin;

import com.algoquest.access.AuthenticatedUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Authenticates a request from its {@code Authorization: Bearer} token; invalid tokens are ignored.
 */
public class BearerTokenFilter extends OncePerRequestFilter {

  private static final String PREFIX = "Bearer ";

  private final TokenService tokens;

  public BearerTokenFilter(TokenService tokens) {
    this.tokens = tokens;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith(PREFIX)) {
      Optional<UUID> userId = tokens.verify(header.substring(PREFIX.length()).trim());
      if (userId.isPresent()) {
        AuthenticatedUser user = new AuthenticatedUser(userId.get());
        var authentication = new UsernamePasswordAuthenticationToken(user, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    }
    chain.doFilter(request, response);
  }
}
