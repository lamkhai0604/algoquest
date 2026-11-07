package com.algoquest.access.security;

import com.algoquest.access.AccessService;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.Serializable;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;

/**
 * Request security (ARCHITECTURE §9.2): API calls need an authenticated user (401 otherwise), and
 * endpoints check named permissions with {@code @PreAuthorize} (403 otherwise). Sessions are not
 * used; the sign-in flow (T-104) adds the bearer token filter.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private static final String PROBLEM =
      "{\"type\":\"about:blank\",\"title\":\"%s\",\"status\":%d,\"detail\":\"%s\"}";

  private static final AuthenticationEntryPoint UNAUTHORIZED =
      (request, response, ex) ->
          writeProblem(response, 401, "Unauthorized", "Sign in to continue.");

  private static final AccessDeniedHandler FORBIDDEN =
      (request, response, ex) ->
          writeProblem(response, 403, "Forbidden", "You do not have access to this.");

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable());
    http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    http.httpBasic(basic -> basic.disable());
    http.formLogin(form -> form.disable());
    http.logout(logout -> logout.disable());
    http.authorizeHttpRequests(
        auth -> auth.requestMatchers("/api/**").authenticated().anyRequest().permitAll());
    http.exceptionHandling(
        errors -> errors.authenticationEntryPoint(UNAUTHORIZED).accessDeniedHandler(FORBIDDEN));
    return http.build();
  }

  @Bean
  static MethodSecurityExpressionHandler methodSecurityExpressionHandler(
      ObjectProvider<AccessService> access) {
    DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
    handler.setPermissionEvaluator(new LazyPermissionEvaluator(access));
    return handler;
  }

  private static void writeProblem(
      HttpServletResponse response, int status, String title, String detail) throws IOException {
    response.setStatus(status);
    response.setContentType("application/problem+json");
    response.getWriter().write(PROBLEM.formatted(title, status, detail));
  }

  /** Resolves the evaluator on first use, so method security does not start the JPA layer early. */
  private static final class LazyPermissionEvaluator implements PermissionEvaluator {

    private final ObjectProvider<AccessService> access;
    private volatile PermissionEvaluator delegate;

    LazyPermissionEvaluator(ObjectProvider<AccessService> access) {
      this.access = access;
    }

    private PermissionEvaluator delegate() {
      if (delegate == null) {
        delegate = new AccessPermissionEvaluator(access.getObject());
      }
      return delegate;
    }

    @Override
    public boolean hasPermission(
        Authentication authentication, Object targetDomainObject, Object permission) {
      return delegate().hasPermission(authentication, targetDomainObject, permission);
    }

    @Override
    public boolean hasPermission(
        Authentication authentication,
        Serializable targetId,
        String targetType,
        Object permission) {
      return delegate().hasPermission(authentication, targetId, targetType, permission);
    }
  }
}
