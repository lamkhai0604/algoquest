package com.algoquest.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.algoquest.access.AccessService;
import com.algoquest.access.AuthenticatedUser;
import com.algoquest.access.SignInProfile;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest(properties = "algoquest.content.location=classpath:content-fixtures/valid/")
@ActiveProfiles("test")
@Transactional
class ContentApiTest {

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;

  private MockMvc mvc;
  private RequestPostProcessor player;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    UUID id = access.signIn(new SignInProfile("github", "p-1", "player@example.com", "Player"));
    player =
        authentication(
            new UsernamePasswordAuthenticationToken(new AuthenticatedUser(id), null, List.of()));
  }

  @Test
  void levelsListEveryLevelWithItsPracticeCount() throws Exception {
    mvc.perform(get("/api/v1/levels").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].available").value(true))
        .andExpect(jsonPath("$[0].problems").value(3))
        .andExpect(jsonPath("$[1].available").value(false));
  }

  @Test
  void lessonHasMarkdownWalkthroughAndQuickCheck() throws Exception {
    mvc.perform(get("/api/v1/levels/1/lesson").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.markdown").value(containsString("Intuition")))
        .andExpect(jsonPath("$.walkthrough.length()").value(3))
        .andExpect(jsonPath("$.quickCheck.length()").value(2));
    mvc.perform(get("/api/v1/levels/2/lesson").with(player)).andExpect(status().isNotFound());
  }

  @Test
  void problemListHasPracticeProblemsByDifficulty() throws Exception {
    mvc.perform(get("/api/v1/levels/1/problems").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("L1-max-value"))
        .andExpect(jsonPath("$[1].id").value("L1-pair-max"))
        .andExpect(jsonPath("$[2].id").value("L1-hard-later"))
        .andExpect(jsonPath("$[2].status").value("comingSoon"))
        .andExpect(jsonPath("$.length()").value(3));
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
  void testProblemsAndUnknownIdsAreNotServed() throws Exception {
    mvc.perform(get("/api/v1/problems/L1-test-max").with(player)).andExpect(status().isNotFound());
    mvc.perform(get("/api/v1/problems/L9-none").with(player)).andExpect(status().isNotFound());
  }

  @Test
  void contentNeedsSignIn() throws Exception {
    mvc.perform(get("/api/v1/levels")).andExpect(status().isUnauthorized());
  }
}
