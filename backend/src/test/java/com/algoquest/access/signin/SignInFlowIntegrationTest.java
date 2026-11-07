package com.algoquest.access.signin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest(
    properties = {
      "algoquest.owner-email=owner@example.com",
      "algoquest.frontend-url=http://localhost:5173",
      "algoquest.jwt-secret=integration-test-secret-of-32-characters"
    })
@ActiveProfiles("test")
@Transactional
class SignInFlowIntegrationTest {

  @TestConfiguration
  static class ClockOverride {
    @Bean
    @Primary
    MutableClock testClock() {
      return new MutableClock(Instant.now());
    }
  }

  @Autowired private WebApplicationContext context;
  @Autowired private OAuthSignInHandler handler;
  @Autowired private MutableClock clock;
  @Autowired private JdbcTemplate jdbc;

  private MockMvc mvc;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
  }

  /** Runs the provider-sign-in handler and returns the one-time code from the redirect. */
  private String providerSignIn(String email, boolean verified) throws Exception {
    Map<String, Object> attributes =
        Map.of("id", 7, "login", "player", "email", email, "email_verified", verified);
    DefaultOAuth2User user =
        new DefaultOAuth2User(AuthorityUtils.createAuthorityList("OAUTH2_USER"), attributes, "id");
    var authentication = new OAuth2AuthenticationToken(user, user.getAuthorities(), "github");
    MockHttpServletResponse response = new MockHttpServletResponse();

    handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authentication);

    String location = response.getRedirectedUrl();
    assertThat(location).startsWith("http://localhost:5173/");
    return location.contains("code=") ? location.substring(location.indexOf("code=") + 5) : null;
  }

  private String exchange(String code) throws Exception {
    String body =
        mvc.perform(
                post("/api/v1/auth/exchange")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"code\":\"" + code + "\"}"))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return body.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
  }

  @Test
  void signInGivesACodeThatBecomesATokenForMe() throws Exception {
    String code = providerSignIn("owner@example.com", true);
    String token = exchange(code);

    mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("owner@example.com"))
        .andExpect(jsonPath("$.roles[0]").value("OWNER"))
        .andExpect(jsonPath("$.permissions").isArray());
  }

  @Test
  void codeWorksOnlyOnce() throws Exception {
    String code = providerSignIn("player@example.com", true);
    exchange(code);

    mvc.perform(
            post("/api/v1/auth/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"" + code + "\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Invalid sign-in code"));
  }

  @Test
  void codeExpiresAfterSixtySeconds() throws Exception {
    String code = providerSignIn("player@example.com", true);
    clock.advance(Duration.ofSeconds(61));

    mvc.perform(
            post("/api/v1/auth/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"" + code + "\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void onlyAHashOfTheCodeIsStored() throws Exception {
    String code = providerSignIn("player@example.com", true);

    Integer raw =
        jdbc.queryForObject(
            "select count(*) from login_code where code_hash = ?", Integer.class, code);
    Integer hashed =
        jdbc.queryForObject(
            "select count(*) from login_code where code_hash = ?",
            Integer.class,
            LoginCodeService.hash(code));
    assertThat(raw).isZero();
    assertThat(hashed).isEqualTo(1);
  }

  @Test
  void unverifiedEmailIsSentBackToSignIn() throws Exception {
    assertThat(providerSignIn("player@example.com", false)).isNull();
  }

  @Test
  void meNeedsAValidToken() throws Exception {
    mvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/me").header("Authorization", "Bearer not-a-token"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void corsAllowsOnlyTheFrontend() throws Exception {
    mvc.perform(
            options("/api/v1/me")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    mvc.perform(
            options("/api/v1/me")
                .header("Origin", "https://evil.example")
                .header("Access-Control-Request-Method", "GET"))
        .andExpect(status().isForbidden());
  }
}
