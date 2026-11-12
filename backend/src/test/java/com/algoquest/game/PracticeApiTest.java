package com.algoquest.game;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.algoquest.access.AccessService;
import com.algoquest.access.AuthenticatedUser;
import com.algoquest.access.SignInProfile;
import com.algoquest.game.domain.ProblemProgress;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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

/** Practice round (FR-09) with the fake grader: 60 or more characters score 95. */
@SpringBootTest(properties = "algoquest.content.location=classpath:content-fixtures/valid/")
@ActiveProfiles("test")
@Transactional
class PracticeApiTest {

  private static final String GOOD =
      "Walk through the array once and keep the largest value seen so far; O(n) time.";

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;
  @Autowired private ProgressStore progress;

  private MockMvc mvc;
  private UUID playerId;
  private RequestPostProcessor player;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    playerId = access.signIn(new SignInProfile("github", "pr-1", "practice@example.com", "P"));
    player =
        authentication(
            new UsernamePasswordAuthenticationToken(
                new AuthenticatedUser(playerId), null, List.of()));
  }

  private void solved(String problem, int xp) {
    progress.lock(playerId, problem, 1);
    progress.save(playerId, problem, new ProblemProgress(true, xp, false));
  }

  private ResultActions practice(String problem, String text) throws Exception {
    return mvc.perform(
        post("/api/v1/problems/" + problem + "/attempts")
            .with(player)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                "{\"attemptId\":\"%s\",\"text\":\"%s\",\"secondsTaken\":60,\"mode\":\"practice\"}"
                    .formatted(UUID.randomUUID(), text)));
  }

  @Test
  void aPassingPracticeAttemptMarksDoneAndAddsTenXp() throws Exception {
    solved("L1-max-value", 105);

    practice("L1-max-value", GOOD)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mode").value("practice"))
        .andExpect(jsonPath("$.solved").value(true))
        .andExpect(jsonPath("$.xpGained").value(10))
        .andExpect(jsonPath("$.levelXp").value(115));

    mvc.perform(get("/api/v1/levels/1/problems").with(player))
        .andExpect(jsonPath("$[0].practiceDone").value(true))
        .andExpect(jsonPath("$[0].xp").value(105));
    practice("L1-max-value", GOOD)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail").value("This problem is already Done."));
  }

  @Test
  void doneNeverFillsPastTheBar() throws Exception {
    solved("L1-max-value", 145);

    practice("L1-max-value", GOOD)
        .andExpect(jsonPath("$.xpGained").value(5))
        .andExpect(jsonPath("$.levelXp").value(150));
    mvc.perform(get("/api/v1/levels").with(player))
        .andExpect(jsonPath("$[0].testOpen").value(true));
  }

  @Test
  void aLowScoreIsRecordedButNotDone() throws Exception {
    solved("L1-max-value", 105);

    practice("L1-max-value", "Sort it.")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.solved").value(false))
        .andExpect(jsonPath("$.xpGained").value(0));
    mvc.perform(get("/api/v1/levels/1/problems").with(player))
        .andExpect(jsonPath("$[0].practiceDone").value(false));
  }

  @Test
  void practiceNeedsSeventyPercentAndASolvedProblem() throws Exception {
    solved("L1-max-value", 100);
    practice("L1-max-value", GOOD).andExpect(status().isForbidden());

    solved("L1-max-value", 105);
    practice("L1-pair-max", GOOD)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail").value("Solve this problem before practising it."));
  }

  @Test
  void anUnknownModeIsRejected() throws Exception {
    mvc.perform(
            post("/api/v1/problems/L1-max-value/attempts")
                .with(player)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"attemptId\":\"%s\",\"text\":\"x\",\"mode\":\"test\"}"
                        .formatted(UUID.randomUUID())))
        .andExpect(status().isBadRequest());
  }
}
