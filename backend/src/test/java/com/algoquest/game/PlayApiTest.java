package com.algoquest.game;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
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

@SpringBootTest(properties = "algoquest.content.location=classpath:content-fixtures/valid/")
@ActiveProfiles("test")
@Transactional
class PlayApiTest {

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
    playerId = signIn("player@example.com");
    player = as(playerId);
  }

  private UUID signIn(String email) {
    return access.signIn(new SignInProfile("github", "id-" + email, email, "Player"));
  }

  private static RequestPostProcessor as(UUID id) {
    return authentication(
        new UsernamePasswordAuthenticationToken(new AuthenticatedUser(id), null, List.of()));
  }

  @Test
  void levelMapShowsStateXpAndCounts() throws Exception {
    mvc.perform(get("/api/v1/levels").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].state").value("OPEN"))
        .andExpect(jsonPath("$[0].available").value(true))
        .andExpect(jsonPath("$[0].xp").value(0))
        .andExpect(jsonPath("$[0].target").value(150))
        .andExpect(jsonPath("$[0].problems").value(2))
        .andExpect(jsonPath("$[0].solved").value(0))
        .andExpect(jsonPath("$[1].state").value("LOCKED"))
        .andExpect(jsonPath("$[1].available").value(false))
        .andExpect(jsonPath("$[1].target").value(150));
  }

  @Test
  void progressBelongsToOnePlayerOnly() throws Exception {
    progress.lock(playerId, "L1-max-value", 1);
    progress.save(playerId, "L1-max-value", new ProblemProgress(true, 110, false));
    RequestPostProcessor other = as(signIn("other@example.com"));

    mvc.perform(get("/api/v1/levels").with(player))
        .andExpect(jsonPath("$[0].xp").value(110))
        .andExpect(jsonPath("$[0].solved").value(1))
        .andExpect(jsonPath("$[0].practiceOpen").value(true))
        .andExpect(jsonPath("$[0].testOpen").value(false));
    mvc.perform(get("/api/v1/levels/1/problems").with(player))
        .andExpect(jsonPath("$[0].solved").value(true))
        .andExpect(jsonPath("$[0].xp").value(110));
    mvc.perform(get("/api/v1/levels").with(other))
        .andExpect(jsonPath("$[0].xp").value(0))
        .andExpect(jsonPath("$[0].solved").value(0));
  }

  @Test
  void theBarStopsAtTheTarget() throws Exception {
    progress.lock(playerId, "L1-max-value", 1);
    progress.save(playerId, "L1-max-value", new ProblemProgress(true, 200, true));

    mvc.perform(get("/api/v1/levels").with(player))
        .andExpect(jsonPath("$[0].xp").value(150))
        .andExpect(jsonPath("$[0].testOpen").value(true));
  }

  @Test
  void lessonIsServedForAnOpenLevelOnly() throws Exception {
    mvc.perform(get("/api/v1/levels/1/lesson").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.markdown").value(containsString("Intuition")))
        .andExpect(jsonPath("$.walkthrough.length()").value(3))
        .andExpect(jsonPath("$.quickCheck.length()").value(2));
    mvc.perform(get("/api/v1/levels/2/lesson").with(player)).andExpect(status().isNotFound());
    mvc.perform(get("/api/v1/levels/99/problems").with(player)).andExpect(status().isNotFound());
  }

  private ResultActions quickCheck(String answers) throws Exception {
    return mvc.perform(
        post("/api/v1/levels/1/quick-check")
            .with(player)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":" + answers + "}"));
  }

  @Test
  void theQuickCheckAwardsFiveXpOnceWhenEveryAnswerIsRight() throws Exception {
    mvc.perform(get("/api/v1/levels/1/lesson").with(player))
        .andExpect(jsonPath("$.quickCheckDone").value(false));

    quickCheck("[1, 1]")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.correct[0]").value(true))
        .andExpect(jsonPath("$.correct[1]").value(false))
        .andExpect(jsonPath("$.done").value(false))
        .andExpect(jsonPath("$.xpGained").value(0));
    quickCheck("[1, 0]")
        .andExpect(jsonPath("$.done").value(true))
        .andExpect(jsonPath("$.xpGained").value(5))
        .andExpect(jsonPath("$.levelXp").value(5))
        .andExpect(jsonPath("$.levelTarget").value(150));
    quickCheck("[1, 0]").andExpect(jsonPath("$.xpGained").value(0));
    quickCheck("[1]").andExpect(status().isBadRequest());

    mvc.perform(get("/api/v1/levels/1/lesson").with(player))
        .andExpect(jsonPath("$.quickCheckDone").value(true));
    mvc.perform(get("/api/v1/levels").with(player)).andExpect(jsonPath("$[0].xp").value(5));
  }

  @Test
  void problemListHasPracticeProblemsByDifficulty() throws Exception {
    mvc.perform(get("/api/v1/levels/1/problems").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(3))
        .andExpect(jsonPath("$[0].id").value("L1-max-value"))
        .andExpect(jsonPath("$[0].locked").value(false))
        .andExpect(jsonPath("$[0].paused").value(false))
        .andExpect(jsonPath("$[1].id").value("L1-pair-max"))
        .andExpect(jsonPath("$[1].locked").value(true))
        .andExpect(jsonPath("$[2].id").value("L1-hard-later"))
        .andExpect(jsonPath("$[2].status").value("comingSoon"));
  }

  @Test
  void problemNeverExposesAnswerKeyHintsOrTests() throws Exception {
    String body =
        mvc.perform(get("/api/v1/problems/L1-max-value").with(player))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.hintCount").value(3))
            .andReturn()
            .getResponse()
            .getContentAsString();

    assertThat(body)
        .contains("Max Value")
        .doesNotContain("answerKey", "keyPoints", "running maximum", "SECRET-HINT", "expected");
  }

  @Test
  void testProblemsPlaceholdersAndUnknownIdsCannotBeOpened() throws Exception {
    mvc.perform(get("/api/v1/problems/L1-test-max").with(player)).andExpect(status().isNotFound());
    mvc.perform(get("/api/v1/problems/L9-none").with(player)).andExpect(status().isNotFound());
    mvc.perform(get("/api/v1/problems/L1-hard-later").with(player))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.detail").value(containsString("later version")));
  }

  @Test
  void playNeedsSignIn() throws Exception {
    mvc.perform(get("/api/v1/levels")).andExpect(status().isUnauthorized());
  }
}
