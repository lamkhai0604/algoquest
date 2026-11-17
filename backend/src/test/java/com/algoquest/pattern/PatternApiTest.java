package com.algoquest.pattern;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
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

/** Pattern Recognition (D-057): labels decide correctness, the grader scores only the reason. */
@SpringBootTest(
    properties = {
      "algoquest.content.location=classpath:content-fixtures/valid/",
      "algoquest.owner-email=owner@example.com"
    })
@ActiveProfiles("test")
@Transactional
class PatternApiTest {

  private static final String REASON =
      "I compare every pair of values and stop at the first two that match. O(n²) time.";

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

  private ResultActions answer(String approach, String reason) throws Exception {
    return mvc.perform(
        post("/api/v1/patterns/P1-repeat/answers")
            .with(player)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"approach\":\"%s\",\"explanation\":\"%s\"}".formatted(approach, reason)));
  }

  @Test
  void theChallengeShowsChoicesWithoutTheirLabels() throws Exception {
    mvc.perform(get("/api/v1/levels/1/patterns").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("P1-repeat"))
        .andExpect(jsonPath("$[0].bestLabel").isEmpty());
    mvc.perform(get("/api/v1/patterns/P1-repeat").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.approaches[0].name").value("HashSet"))
        .andExpect(jsonPath("$.approaches[1].name").value("Nested loops"))
        .andExpect(jsonPath("$.answersLeftToday").value(5))
        .andExpect(content().string(not(containsString("\"label\""))))
        .andExpect(content().string(not(containsString("best"))));
  }

  @Test
  void aValidAlternativeIsCorrectEvenThoughItIsNotTheBest() throws Exception {
    answer("nested", REASON)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.correct").value(true))
        .andExpect(jsonPath("$.label").value("valid"))
        .andExpect(jsonPath("$.bestApproach").value("hash"))
        .andExpect(jsonPath("$.reason").value(60))
        .andExpect(jsonPath("$.complexity").value(40))
        .andExpect(jsonPath("$.reasonScore").value(100))
        .andExpect(jsonPath("$.comparison[0].id").value("hash"))
        .andExpect(jsonPath("$.comparison[2].label").value("unsuitable"))
        .andExpect(jsonPath("$.answersLeftToday").value(4));
    mvc.perform(get("/api/v1/levels/1/patterns").with(player))
        .andExpect(jsonPath("$[0].bestLabel").value("valid"));
  }

  @Test
  void anUnsuitableChoiceIsNotCorrectWhateverTheReasonScore() throws Exception {
    answer("pass", "I keep one running value and check it as I go along.")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.correct").value(false))
        .andExpect(jsonPath("$.label").value("unsuitable"));
  }

  @Test
  void badAnswersAreRefused() throws Exception {
    answer("magic", REASON).andExpect(status().isBadRequest());
    answer("hash", "short").andExpect(status().isBadRequest());
    mvc.perform(get("/api/v1/patterns/P9-nothing").with(player)).andExpect(status().isNotFound());
  }

  @Test
  void eachChallengeAllowsFiveAnswersADay() throws Exception {
    for (int i = 0; i < PatternService.DAILY_LIMIT; i++) {
      answer("hash", REASON).andExpect(status().isOk());
    }
    answer("hash", REASON).andExpect(status().isTooManyRequests());
  }

  @Test
  void theOwnerCanReviewAnswersAndPlayersCannot() throws Exception {
    answer("nested", REASON).andExpect(status().isOk());
    mvc.perform(get("/api/v1/admin/pattern-answers").with(owner))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].challengeId").value("P1-repeat"))
        .andExpect(jsonPath("$[0].approachId").value("nested"))
        .andExpect(jsonPath("$[0].label").value("valid"))
        .andExpect(jsonPath("$[0].grader").value("fake"));
    mvc.perform(get("/api/v1/admin/pattern-answers").with(player))
        .andExpect(status().isForbidden());
  }
}
