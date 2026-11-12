package com.algoquest.game;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.algoquest.access.AccessService;
import com.algoquest.access.AuthenticatedUser;
import com.algoquest.access.SignInProfile;
import com.algoquest.access.signin.MutableClock;
import com.algoquest.game.domain.ProblemProgress;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/** Hints and the 3-per-5-hours quota (FR-06), with the fixture problems' 3 hints each. */
@SpringBootTest(properties = "algoquest.content.location=classpath:content-fixtures/valid/")
@ActiveProfiles("test")
@Transactional
class HintApiTest {

  @TestConfiguration
  static class ClockOverride {
    @Bean
    @Primary
    MutableClock testClock() {
      return new MutableClock(START);
    }
  }

  private static final Instant START = Instant.parse("2026-11-09T12:00:00Z");
  private static final String GOOD =
      "Walk through the array once and keep the largest value seen so far; O(n) time.";

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;
  @Autowired private MutableClock clock;
  @Autowired private ProgressStore progress;

  private MockMvc mvc;
  private UUID playerId;
  private RequestPostProcessor player;

  @BeforeEach
  void setUp() {
    clock.set(START);
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    playerId = access.signIn(new SignInProfile("github", "h-1", "hints@example.com", "Player"));
    player =
        authentication(
            new UsernamePasswordAuthenticationToken(
                new AuthenticatedUser(playerId), null, List.of()));
  }

  private ResultActions open(String problem) throws Exception {
    return mvc.perform(post("/api/v1/problems/" + problem + "/hints").with(player));
  }

  @Test
  void hintsOpenInOrderAndUseTheQuota() throws Exception {
    mvc.perform(get("/api/v1/problems/L1-max-value/hints").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.opened.length()").value(0))
        .andExpect(jsonPath("$.total").value(3))
        .andExpect(jsonPath("$.quota.remaining").value(3))
        .andExpect(jsonPath("$.quota.refillsAt").doesNotExist());

    open("L1-max-value")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.opened[0]").value("SECRET-HINT-1"))
        .andExpect(jsonPath("$.opened.length()").value(1))
        .andExpect(jsonPath("$.quota.remaining").value(2))
        .andExpect(jsonPath("$.quota.refillsAt").value("2026-11-09T17:00:00Z"));
    open("L1-max-value").andExpect(jsonPath("$.opened[1]").value("SECRET-HINT-2"));

    mvc.perform(get("/api/v1/problems/L1-max-value/hints").with(player))
        .andExpect(jsonPath("$.opened.length()").value(2))
        .andExpect(jsonPath("$.quota.remaining").value(1));
    mvc.perform(get("/api/v1/hints/quota").with(player))
        .andExpect(jsonPath("$.remaining").value(1))
        .andExpect(jsonPath("$.perWindow").value(3));
  }

  @Test
  void aFourthHintWithinFiveHoursIsRefusedUntilOneComesBack() throws Exception {
    open("L1-max-value");
    clock.advance(Duration.ofHours(1));
    open("L1-max-value");
    // The second problem opens once the first is solved (D-042).
    progress.lock(playerId, "L1-max-value", 1);
    progress.save(playerId, "L1-max-value", new ProblemProgress(true, 12, false));
    open("L1-pair-max");

    open("L1-pair-max")
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.title").value("No hints left"));

    clock.advance(Duration.ofHours(4));
    open("L1-pair-max")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.opened.length()").value(2))
        .andExpect(jsonPath("$.quota.remaining").value(0));
  }

  @Test
  void aProblemHasOnlyThreeHints() throws Exception {
    open("L1-max-value");
    open("L1-max-value");
    open("L1-max-value");
    clock.advance(Duration.ofHours(6));

    open("L1-max-value").andExpect(status().isConflict());
  }

  @Test
  void eachHintLowersTheProblemXpBy20Percent() throws Exception {
    open("L1-max-value");
    open("L1-max-value");

    mvc.perform(
            post("/api/v1/problems/L1-max-value/attempts")
                .with(player)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"attemptId\":\"%s\",\"text\":\"%s\",\"secondsTaken\":60}"
                        .formatted(UUID.randomUUID(), GOOD)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.xpGained").value(12)); // 20 x 0.6
  }

  @Test
  void hintsOnlyForPlayableProblems() throws Exception {
    open("L1-hard-later").andExpect(status().isForbidden());
    open("L1-test-max").andExpect(status().isNotFound());
    mvc.perform(post("/api/v1/problems/L1-max-value/hints")).andExpect(status().isUnauthorized());
  }
}
