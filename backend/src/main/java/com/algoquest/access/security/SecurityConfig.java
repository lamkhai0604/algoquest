package com.algoquest.access.security;

import com.algoquest.access.AccessService;
import com.algoquest.access.signin.BearerTokenFilter;
import com.algoquest.access.signin.GitHubEmailUserService;
import com.algoquest.access.signin.OAuthSignInHandler;
import com.algoquest.access.signin.TokenService;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.Serializable;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.client.RestClient;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Request security (ARCHITECTURE §9.2): API calls need an authenticated user (401 otherwise), and
 * endpoints check named permissions with {@code @PreAuthorize} (403 otherwise). Requests carry the
 * app's bearer token; a session exists only during the provider sign-in redirect.
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
  SecurityFilterChain securityFilterChain(
      HttpSecurity http, TokenService tokens, OAuthSignInHandler signIn) throws Exception {
    http.csrf(csrf -> csrf.disable());
    http.cors(Customizer.withDefaults());
    http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    http.httpBasic(basic -> basic.disable());
    http.formLogin(form -> form.disable());
    http.logout(logout -> logout.disable());
    http.authorizeHttpRequests(
        auth -> {
          auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/exchange").permitAll();
          auth.requestMatchers("/api/**").authenticated();
          auth.anyRequest().permitAll();
        });
    GitHubEmailUserService users = new GitHubEmailUserService(github());
    http.oauth2Login(
        login -> {
          login.userInfoEndpoint(info -> info.userService(users));
          login.authorizedClientRepository(new HttpSessionOAuth2AuthorizedClientRepository());
          login.successHandler(signIn);
          login.failureHandler(signIn);
        });
    http.addFilterBefore(new BearerTokenFilter(tokens), UsernamePasswordAuthenticationFilter.class);
    http.exceptionHandling(
        errors -> errors.authenticationEntryPoint(UNAUTHORIZED).accessDeniedHandler(FORBIDDEN));
    return http.build();
  }

  /** Only the frontend may call the API from a browser. */
  @Bean
  CorsConfigurationSource corsConfigurationSource(
      @Value("${algoquest.frontend-url}") String frontendUrl) {
    CorsConfiguration cors = new CorsConfiguration();
    cors.setAllowedOrigins(List.of(frontendUrl));
    cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    cors.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", cors);
    return source;
  }

  private static RestClient github() {
    return RestClient.builder()
        .baseUrl("https://api.github.com")
        .defaultHeader("Accept", "application/vnd.github+json")
        .build();
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
