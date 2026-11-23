package com.algoquest.access.signin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/**
 * Owner and guest sign-in with email and password; Google, GitHub and demo sign-in off (D-073,
 * D-075).
 */
@SpringBootTest(
    properties = {
      "algoquest.owner-email=Owner@Example.com",
      "algoquest.owner-password=test-only-password-123",
      "algoquest.guest-email=guest@algoquest.app",
      "algoquest.guest-password=guest-only-password-456",
      "algoquest.jwt-secret=integration-test-secret-of-32-characters"
    })
@ActiveProfiles("test")
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PasswordSignInIntegrationTest {

  @TestConfiguration
  static class ClockOverride {
    @Bean
    @Primary
    MutableClock testClock() {
      return new MutableClock(Instant.now());
    }
  }

  @Autowired private WebApplicationContext context;
  @Autowired private MutableClock clock;

  private MockMvc mvc;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
  }

  private ResultActions signIn(String email, String password) throws Exception {
    return mvc.perform(
        post("/api/v1/auth/password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"));
  }

  private String token(String code) throws Exception {
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
  void onlyThePasswordFormIsOffered() throws Exception {
    mvc.perform(get("/api/v1/auth/options"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.password").value(true))
        .andExpect(jsonPath("$.oauth").value(false))
        .andExpect(jsonPath("$.demo").value(false));
    mvc.perform(get("/oauth2/authorization/google")).andExpect(status().isNotFound());
    mvc.perform(post("/api/v1/auth/demo")).andExpect(status().isNotFound());
  }

  @Test
  void theOwnerSignsInWithEmailAndPassword() throws Exception {
    String body =
        signIn(" owner@example.com ", "test-only-password-123")
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String code = body.replaceAll(".*\"code\":\"([^\"]+)\".*", "$1");

    mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + token(code)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("owner@example.com"))
        .andExpect(jsonPath("$.roles[?(@ == 'OWNER')]").exists());
  }

  @Test
  void aWrongEmailOrPasswordIsRefused() throws Exception {
    signIn("owner@example.com", "wrong-password-0000")
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.title").value("Wrong email or password"));
    signIn("someone@example.com", "test-only-password-123").andExpect(status().isUnauthorized());
  }

  @Test
  void fiveWrongAttemptsLockSignInForFifteenMinutes() throws Exception {
    for (int i = 0; i < PasswordSignInController.MAX_FAILURES; i++) {
      signIn("owner@example.com", "wrong-password-" + i).andExpect(status().isUnauthorized());
    }
    signIn("owner@example.com", "test-only-password-123")
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.title").value("Too many attempts"));

    clock.advance(PasswordSignInController.WINDOW.plus(Duration.ofSeconds(1)));
    signIn("owner@example.com", "test-only-password-123").andExpect(status().isOk());
  }

  private String bearer(String email, String password) throws Exception {
    String body =
        signIn(email, password)
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return "Bearer " + token(body.replaceAll(".*\"code\":\"([^\"]+)\".*", "$1"));
  }

  @Test
  void theGuestSignsInAndCanLearnAndKeepNotesButNotAdminister() throws Exception {
    String guest = bearer("Guest@AlgoQuest.app", "guest-only-password-456");

    mvc.perform(get("/api/v1/me").header("Authorization", guest))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("guest@algoquest.app"))
        .andExpect(jsonPath("$.roles[?(@ == 'GUEST')]").exists())
        .andExpect(jsonPath("$.roles[?(@ == 'OWNER')]").doesNotExist())
        .andExpect(jsonPath("$.permissions[?(@ == 'notes.manage')]").exists())
        .andExpect(jsonPath("$.permissions[?(@ == 'game.play')]").exists());
    mvc.perform(get("/api/v1/admin/users").header("Authorization", guest))
        .andExpect(status().isForbidden());
  }

  @Test
  void theGuestNeverSeesTheOwnersNotes() throws Exception {
    String owner = bearer("owner@example.com", "test-only-password-123");
    String guest = bearer("guest@algoquest.app", "guest-only-password-456");

    String created =
        mvc.perform(
                post("/api/v1/notes")
                    .header("Authorization", owner)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"title\":\"Owner only\",\"body\":{\"type\":\"doc\",\"content\":[]},"
                            + "\"bodyText\":\"\",\"tags\":[],\"level\":null}"))
            .andExpect(status().is2xxSuccessful())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String id = created.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

    mvc.perform(get("/api/v1/notes").header("Authorization", guest))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.title == 'Owner only')]").doesNotExist());
    mvc.perform(get("/api/v1/notes/" + id).header("Authorization", guest))
        .andExpect(status().isNotFound());
  }

  @Test
  void theGuestPasswordDoesNotOpenTheOwnerAccount() throws Exception {
    signIn("owner@example.com", "guest-only-password-456").andExpect(status().isUnauthorized());
  }
}
