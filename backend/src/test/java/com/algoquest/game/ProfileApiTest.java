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

/** Profile and streak (FR-12, FR-13), with days counted in Los Angeles time. */
@SpringBootTest(properties = "algoquest.content.location=classpath:content-fixtures/valid/")
@ActiveProfiles("test")
@Transactional
class ProfileApiTest {

  @TestConfiguration
  static class ClockOverride {
    @Bean
    @Primary
    MutableClock testClock() {
      return new MutableClock(MONDAY_EVENING_LA);
    }
  }

  /** Monday 2026-11-09, 20:00 in Los Angeles (Tuesday 04:00 UTC). */
  private static final Instant MONDAY_EVENING_LA = Instant.parse("2026-11-10T04:00:00Z");

  private static final String ZONE = "America/Los_Angeles";
  private static final String GOOD =
      "Walk through the array once and keep the largest value seen so far; O(n) time.";

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;
  @Autowired private MutableClock clock;

  private MockMvc mvc;
  private RequestPostProcessor player;

  @BeforeEach
  void setUp() {
    clock.set(MONDAY_EVENING_LA);
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    UUID id = access.signIn(new SignInProfile("github", "s-1", "streak@example.com", "Streaker"));
    player =
        authentication(
            new UsernamePasswordAuthenticationToken(new AuthenticatedUser(id), null, List.of()));
  }

  private void solve(String problem, String text) throws Exception {
    mvc.perform(
            post("/api/v1/problems/" + problem + "/attempts")
                .with(player)
                .header("X-Time-Zone", ZONE)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"attemptId\":\"%s\",\"text\":\"%s\"}".formatted(UUID.randomUUID(), text)))
        .andExpect(status().isOk());
  }

  private ResultActions profile() throws Exception {
    return mvc.perform(get("/api/v1/profile").with(player).header("X-Time-Zone", ZONE));
  }

  @Test
  void aNewPlayerHasAnEmptyProfile() throws Exception {
    profile()
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName").value("Streaker"))
        .andExpect(jsonPath("$.totalXp").value(0))
        .andExpect(jsonPath("$.solvedProblems").value(0))
        .andExpect(jsonPath("$.currentStreak").value(0))
        .andExpect(jsonPath("$.bestStreak").value(0))
        .andExpect(jsonPath("$.levels.length()").value(2));
  }

  @Test
  void solvesOnConsecutiveLocalDaysBuildAStreak() throws Exception {
    solve("L1-max-value", GOOD);
    profile()
        .andExpect(jsonPath("$.currentStreak").value(1))
        .andExpect(jsonPath("$.totalXp").value(20))
        .andExpect(jsonPath("$.solvedProblems").value(1));

    // Two hours later it is still Monday in Los Angeles: no change.
    clock.advance(Duration.ofHours(2));
    solve("L1-pair-max", GOOD);
    profile().andExpect(jsonPath("$.currentStreak").value(1));

    // Tuesday evening in Los Angeles.
    clock.advance(Duration.ofHours(22));
    solve("L1-max-value", GOOD);
    profile()
        .andExpect(jsonPath("$.currentStreak").value(2))
        .andExpect(jsonPath("$.bestStreak").value(2));
  }

  @Test
  void aMissedDayResetsTheShownStreakButKeepsTheBest() throws Exception {
    solve("L1-max-value", GOOD);
    clock.advance(Duration.ofDays(1));
    solve("L1-max-value", GOOD);

    clock.advance(Duration.ofDays(2));
    profile()
        .andExpect(jsonPath("$.currentStreak").value(0))
        .andExpect(jsonPath("$.bestStreak").value(2));
  }

  @Test
  void aFailedAttemptDoesNotCount() throws Exception {
    solve("L1-max-value", "Sort it.");

    profile().andExpect(jsonPath("$.currentStreak").value(0));
  }
}
