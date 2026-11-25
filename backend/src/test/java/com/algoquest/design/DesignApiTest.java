package com.algoquest.design;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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

/** Design prompts (D-085): graded with the rubric; the reference arrives only with a grade. */
@SpringBootTest(
    properties = {
      "algoquest.content.location=classpath:content-fixtures/valid/",
      "algoquest.owner-email=owner@example.com"
    })
@ActiveProfiles("test")
@Transactional
class DesignApiTest {

  private static final String LONG = "A section that is long enough to earn full fake points.";

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;

  private MockMvc mvc;
  private RequestPostProcessor player;
  private RequestPostProcessor owner;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    player = as(signIn("player@example.com"));
    owner = as(signIn("owner@example.com"));
  }

  private UUID signIn(String email) {
    return access.signIn(new SignInProfile("github", "id-" + email, email, "Player"));
  }

  private static RequestPostProcessor as(UUID id) {
    return authentication(
        new UsernamePasswordAuthenticationToken(new AuthenticatedUser(id), null, List.of()));
  }

  private ResultActions answer(String requirements, String estimate) throws Exception {
    return mvc.perform(
        post("/api/v1/designs/D1-counter/answers")
            .with(player)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                "{\"requirements\":\"%s\",\"estimate\":\"%s\",\"components\":\"%s\",\"failure\":\"%s\"}"
                    .formatted(requirements, estimate, LONG, LONG)));
  }

  @Test
  void thePromptHidesCriteriaAndTheReference() throws Exception {
    mvc.perform(get("/api/v1/levels/1/designs").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("D1-counter"))
        .andExpect(jsonPath("$[0].bestScore").isEmpty());
    mvc.perform(get("/api/v1/designs/D1-counter").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.facts[0]").value("About 100 visits per second at peak"))
        .andExpect(jsonPath("$.sections[2]").value("components"))
        .andExpect(jsonPath("$.answersLeftToday").value(DesignService.DAILY_LIMIT))
        .andExpect(content().string(not(containsString("criteria"))))
        .andExpect(content().string(not(containsString("fullMarkDesigns"))))
        .andExpect(content().string(not(containsString("reference"))));
  }

  @Test
  void aGradedAnswerHasEveryCategoryAndTheReference() throws Exception {
    answer(LONG, "Short one.")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.categories[0].category").value("requirements"))
        .andExpect(jsonPath("$.categories[0].points").value(20))
        .andExpect(jsonPath("$.categories[1].points").value(7))
        .andExpect(jsonPath("$.categories[1].max").value(15))
        .andExpect(jsonPath("$.total").value(92))
        .andExpect(jsonPath("$.reference.design").isNotEmpty())
        .andExpect(jsonPath("$.answersLeftToday").value(DesignService.DAILY_LIMIT - 1));
    mvc.perform(get("/api/v1/levels/1/designs").with(player))
        .andExpect(jsonPath("$[0].bestScore").value(92));
  }

  @Test
  void badAnswersAreRefused() throws Exception {
    answer(LONG, "").andExpect(status().isBadRequest());
    mvc.perform(get("/api/v1/designs/D9-nothing").with(player)).andExpect(status().isNotFound());
  }

  @Test
  void eachPromptAllowsAFewAnswersADay() throws Exception {
    for (int i = 0; i < DesignService.DAILY_LIMIT; i++) {
      answer(LONG, LONG).andExpect(status().isOk());
    }
    answer(LONG, LONG).andExpect(status().isTooManyRequests());
  }

  @Test
  void theOwnerCanReviewAnswersAndPlayersCannot() throws Exception {
    answer(LONG, LONG).andExpect(status().isOk());
    mvc.perform(get("/api/v1/admin/design-answers").with(owner))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].promptId").value("D1-counter"))
        .andExpect(jsonPath("$[0].total").value(100))
        .andExpect(jsonPath("$[0].grader").value("fake"));
    mvc.perform(get("/api/v1/admin/design-answers").with(player)).andExpect(status().isForbidden());
  }
}
