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
import com.jayway.jsonpath.JsonPath;
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

/**
 * Level-up tests (FR-10) with the fake grader (60+ characters score 95, shorter text 35, the down
 * marker fails). The fixture level 1 has three test problems; level 2 has no content.
 */
@SpringBootTest(
    properties = {
      "algoquest.content.location=classpath:content-fixtures/valid/",
      "algoquest.test.duration=PT2H"
    })
@ActiveProfiles("test")
@Transactional
class LevelTestApiTest {

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
  private static final List<String> PROBLEMS = List.of("L1-test-max", "L1-test-three", "L1-test-two");

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;
  @Autowired private ProgressStore progress;
  @Autowired private MutableClock clock;

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
    playerId = access.signIn(new SignInProfile("github", "t-1", "test@example.com", "Tester"));
    player =
        authentication(
            new UsernamePasswordAuthenticationToken(
                new AuthenticatedUser(playerId), null, List.of()));
  }

  private void fillTheBar() {
    progress.lock(playerId, "L1-max-value", 1);
    progress.save(playerId, "L1-max-value", new ProblemProgress(true, 100, false));
  }

  private String start() throws Exception {
    String body =
        mvc.perform(post("/api/v1/levels/1/tests").with(player))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return JsonPath.read(body, "$.id");
  }

  private ResultActions answer(String test, String problem, String text) throws Exception {
    return mvc.perform(
        post("/api/v1/tests/" + test + "/answers")
            .with(player)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"problemId\":\"%s\",\"text\":\"%s\"}".formatted(problem, text)));
  }

  private ResultActions submit(String test) throws Exception {
    return mvc.perform(post("/api/v1/tests/" + test + "/submit").with(player));
  }

  private void expectLevel2(String state) throws Exception {
    mvc.perform(get("/api/v1/levels").with(player))
        .andExpect(jsonPath("$[1].state").value(state));
  }

  @Test
  void theTestOpensOnlyWithAFullBar() throws Exception {
    mvc.perform(post("/api/v1/levels/1/tests").with(player)).andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/levels/2/tests").with(player)).andExpect(status().isNotFound());
  }

  @Test
  void aStartedTestHasThreeProblemsAndATwoHourClock() throws Exception {
    fillTheBar();
    String test = start();

    mvc.perform(get("/api/v1/tests/" + test).with(player))
        .andExpect(jsonPath("$.status").value("running"))
        .andExpect(jsonPath("$.endsAt").value("2026-11-09T14:00:00Z"))
        .andExpect(jsonPath("$.problems.length()").value(3))
        .andExpect(jsonPath("$.problems[0].problem.id").value(PROBLEMS.get(0)))
        .andExpect(jsonPath("$.problems[0].problem.hintCount").value(3))
        .andExpect(jsonPath("$.problems[0].result").doesNotExist());
    // Starting again returns the same running test.
    mvc.perform(post("/api/v1/levels/1/tests").with(player)).andExpect(jsonPath("$.id").value(test));
  }

  @Test
  void aPerfectScoreOpensTheNextLevel() throws Exception {
    fillTheBar();
    String test = start();
    for (String problem : PROBLEMS) {
      answer(test, problem, GOOD).andExpect(status().isOk());
    }
    expectLevel2("LOCKED");

    submit(test)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("submitted"))
        .andExpect(jsonPath("$.score").value(95))
        .andExpect(jsonPath("$.problems[0].result.pattern").value(40))
        .andExpect(jsonPath("$.nextLevelState").value("EASY_ONLY"));
    expectLevel2("EASY_ONLY");
    mvc.perform(get("/api/v1/levels").with(player))
        .andExpect(jsonPath("$[0].bestTestScore").value(95));
  }

  @Test
  void aLowScoreKeepsTheNextLevelLockedAndRetakesKeepTheBest() throws Exception {
    fillTheBar();
    String first = start();
    answer(first, PROBLEMS.get(0), GOOD);
    submit(first).andExpect(jsonPath("$.score").value(31)); // (95 + 0 + 0) / 3
    expectLevel2("LOCKED");

    String second = start();
    for (String problem : PROBLEMS) {
      answer(second, problem, GOOD);
    }
    submit(second).andExpect(jsonPath("$.score").value(95));

    String third = start();
    submit(third).andExpect(jsonPath("$.score").value(0));
    expectLevel2("EASY_ONLY");
    mvc.perform(get("/api/v1/levels").with(player))
        .andExpect(jsonPath("$[0].bestTestScore").value(95));
  }

  @Test
  void afterTheEndTimeAnswersAreClosedAndSubmitGradesWhatWasSaved() throws Exception {
    fillTheBar();
    String test = start();
    answer(test, PROBLEMS.get(0), GOOD);
    clock.advance(Duration.ofHours(2));

    mvc.perform(get("/api/v1/tests/" + test).with(player))
        .andExpect(jsonPath("$.status").value("timeUp"));
    answer(test, PROBLEMS.get(1), GOOD).andExpect(status().isConflict());
    submit(test).andExpect(jsonPath("$.score").value(31));
  }

  @Test
  void aGraderFailureKeepsTheTestOpenAndGradesAreKept() throws Exception {
    fillTheBar();
    String test = start();
    answer(test, PROBLEMS.get(0), GOOD);
    answer(test, PROBLEMS.get(1), GOOD + " GRADER-DOWN");

    submit(test).andExpect(status().isServiceUnavailable());
    mvc.perform(get("/api/v1/tests/" + test).with(player))
        .andExpect(jsonPath("$.status").value("running"));

    answer(test, PROBLEMS.get(1), GOOD);
    submit(test).andExpect(jsonPath("$.score").value(63)); // (95 + 95 + 0) / 3
  }

  @Test
  void submittingTwiceReturnsTheSameResult() throws Exception {
    fillTheBar();
    String test = start();
    answer(test, PROBLEMS.get(0), GOOD);
    submit(test).andExpect(jsonPath("$.score").value(31));

    submit(test).andExpect(status().isOk()).andExpect(jsonPath("$.score").value(31));
    answer(test, PROBLEMS.get(1), GOOD).andExpect(status().isConflict());
  }

  @Test
  void testProblemsAndOtherPlayersTestsStayHidden() throws Exception {
    fillTheBar();
    String test = start();
    answer(test, "L1-max-value", GOOD).andExpect(status().isBadRequest());
    mvc.perform(get("/api/v1/problems/L1-test-max").with(player)).andExpect(status().isNotFound());

    UUID otherId = access.signIn(new SignInProfile("github", "t-2", "other@example.com", "Other"));
    RequestPostProcessor other =
        authentication(
            new UsernamePasswordAuthenticationToken(
                new AuthenticatedUser(otherId), null, List.of()));
    mvc.perform(get("/api/v1/tests/" + test).with(other)).andExpect(status().isNotFound());
  }
}
