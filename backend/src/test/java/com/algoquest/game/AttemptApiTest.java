package com.algoquest.game;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.algoquest.access.AccessService;
import com.algoquest.access.AuthenticatedUser;
import com.algoquest.access.SignInProfile;
import com.algoquest.grading.GraderUnavailableException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/** Attempts with the fake grader: 60 or more characters score 95, fewer score 35. */
@SpringBootTest(properties = "algoquest.content.location=classpath:content-fixtures/valid/")
@ActiveProfiles("test")
@Transactional
class AttemptApiTest {

  private static final String GOOD =
      "Walk through the array once and keep the largest value seen so far; O(n) time.";
  private static final String EASY = "L1-max-value";
  private static final String MEDIUM = "L1-pair-max";

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;
  @Autowired private JdbcTemplate jdbc;

  private MockMvc mvc;
  private RequestPostProcessor player;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    player = as("player@example.com");
  }

  private RequestPostProcessor as(String email) {
    UUID id = access.signIn(new SignInProfile("github", "id-" + email, email, "Player"));
    return authentication(
        new UsernamePasswordAuthenticationToken(new AuthenticatedUser(id), null, List.of()));
  }

  private ResultActions submit(
      RequestPostProcessor who, String problem, UUID attemptId, String text, int seconds)
      throws Exception {
    String body =
        "{\"attemptId\":\"%s\",\"text\":\"%s\",\"secondsTaken\":%d}"
            .formatted(attemptId, text, seconds);
    return mvc.perform(
        post("/api/v1/problems/" + problem + "/attempts")
            .with(who)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body));
  }

  private int attemptCount() {
    return jdbc.queryForObject("select count(*) from attempt", Integer.class);
  }

  private void expectLevelXp(int xp) throws Exception {
    mvc.perform(get("/api/v1/levels").with(player)).andExpect(jsonPath("$[0].xp").value(xp));
  }

  @Test
  void aGoodExplanationSolvesTheProblemAndEarnsXp() throws Exception {
    submit(player, EASY, UUID.randomUUID(), GOOD, 60)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.pattern").value(40))
        .andExpect(jsonPath("$.steps").value(30))
        .andExpect(jsonPath("$.complexity").value(20))
        .andExpect(jsonPath("$.edgeCases").value(5))
        .andExpect(jsonPath("$.total").value(95))
        .andExpect(jsonPath("$.solved").value(true))
        .andExpect(jsonPath("$.feedback").isNotEmpty())
        .andExpect(jsonPath("$.xpGained").value(25))
        .andExpect(jsonPath("$.levelXp").value(25))
        .andExpect(jsonPath("$.levelTarget").value(100));

    assertThat(attemptCount()).isEqualTo(1);
    expectLevelXp(25);
  }

  @Test
  void aSlowSolveGetsNoTimeBonusAndMediumEarnsMore() throws Exception {
    submit(player, EASY, UUID.randomUUID(), GOOD, 16 * 60)
        .andExpect(jsonPath("$.xpGained").value(20));
    submit(player, MEDIUM, UUID.randomUUID(), GOOD, 60)
        .andExpect(jsonPath("$.xpGained").value(35))
        .andExpect(jsonPath("$.levelXp").value(55));
  }

  @Test
  void repeatingAnAttemptIdReturnsTheStoredResultOnce() throws Exception {
    UUID attemptId = UUID.randomUUID();
    submit(player, EASY, attemptId, GOOD, 60).andExpect(jsonPath("$.xpGained").value(25));

    submit(player, EASY, attemptId, "a different text", 60)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(95))
        .andExpect(jsonPath("$.xpGained").value(25))
        .andExpect(jsonPath("$.levelXp").value(25));

    assertThat(attemptCount()).isEqualTo(1);
    expectLevelXp(25);
  }

  @Test
  void solvingAgainEarnsNoMoreXp() throws Exception {
    submit(player, EASY, UUID.randomUUID(), GOOD, 60);

    submit(player, EASY, UUID.randomUUID(), GOOD, 60)
        .andExpect(jsonPath("$.solved").value(true))
        .andExpect(jsonPath("$.xpGained").value(0))
        .andExpect(jsonPath("$.levelXp").value(25));
    assertThat(attemptCount()).isEqualTo(2);
  }

  @Test
  void aWeakExplanationIsRecordedButDoesNotSolve() throws Exception {
    submit(player, EASY, UUID.randomUUID(), "Sort it.", 60)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(35))
        .andExpect(jsonPath("$.solved").value(false))
        .andExpect(jsonPath("$.xpGained").value(0));

    assertThat(attemptCount()).isEqualTo(1);
    expectLevelXp(0);
    mvc.perform(get("/api/v1/levels/1/problems").with(player))
        .andExpect(jsonPath("$[0].solved").value(false));
  }

  @Test
  void whenTheGraderIsDownNothingIsRecorded() throws Exception {
    submit(player, EASY, UUID.randomUUID(), GOOD + " GRADER-DOWN", 60)
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.detail").value(GraderUnavailableException.MESSAGE));

    assertThat(attemptCount()).isZero();
    expectLevelXp(0);
  }

  @Test
  void emptyAndTooLongExplanationsAreRejectedBeforeGrading() throws Exception {
    submit(player, EASY, UUID.randomUUID(), "   ", 60).andExpect(status().isBadRequest());
    submit(player, EASY, UUID.randomUUID(), "x".repeat(2001), 60)
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Invalid attempt"));
    submit(player, EASY, UUID.randomUUID(), "x".repeat(2000), 60).andExpect(status().isOk());
    mvc.perform(
            post("/api/v1/problems/" + EASY + "/attempts")
                .with(player)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"no id\"}"))
        .andExpect(status().isBadRequest());

    assertThat(attemptCount()).isEqualTo(1);
  }

  @Test
  void anAttemptIdOfAnotherPlayerIsRefused() throws Exception {
    UUID attemptId = UUID.randomUUID();
    submit(player, EASY, attemptId, GOOD, 60).andExpect(status().isOk());

    submit(as("other@example.com"), EASY, attemptId, GOOD, 60).andExpect(status().isConflict());
    assertThat(attemptCount()).isEqualTo(1);
  }

  @Test
  void onlyPlayableProblemsAcceptAttempts() throws Exception {
    submit(player, "L1-hard-later", UUID.randomUUID(), GOOD, 60).andExpect(status().isForbidden());
    submit(player, "L1-test-max", UUID.randomUUID(), GOOD, 60).andExpect(status().isNotFound());
    mvc.perform(
            post("/api/v1/problems/" + EASY + "/attempts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isUnauthorized());

    assertThat(attemptCount()).isZero();
  }
}
