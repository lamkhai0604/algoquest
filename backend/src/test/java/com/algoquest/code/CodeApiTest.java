package com.algoquest.code;

import static org.assertj.core.api.Assertions.assertThat;
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
import org.hamcrest.Matchers;
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

/**
 * Code answers for double XP (FR-07) with the fake Java runner. The fixture problem L1-max-value
 * has 8 tests whose expected outputs are 1 to 8.
 */
@SpringBootTest(
    properties = {
      "algoquest.content.location=classpath:content-fixtures/valid/",
      "algoquest.code.java.daily-limit=3"
    })
@ActiveProfiles("test")
@Transactional
class CodeApiTest {

  private static final String GOOD =
      "Walk through the array once and keep the largest value seen so far; O(n) time.";
  private static final String EASY = "L1-max-value";
  private static final String RIGHT = "[1,2,3,4,5,6,7,8]";

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
    UUID id = access.signIn(new SignInProfile("github", "c-1", "coder@example.com", "Coder"));
    player =
        authentication(
            new UsernamePasswordAuthenticationToken(new AuthenticatedUser(id), null, List.of()));
  }

  private void solveExplanation() throws Exception {
    mvc.perform(
            post("/api/v1/problems/" + EASY + "/attempts")
                .with(player)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"attemptId\":\"%s\",\"text\":\"%s\"}".formatted(UUID.randomUUID(), GOOD)))
        .andExpect(jsonPath("$.xpGained").value(20));
  }

  private ResultActions javascript(String outputs, String errors) throws Exception {
    String body =
        "{\"language\":\"javascript\",\"code\":\"function solve(n) { return 1; }\","
            + "\"outputs\":"
            + outputs
            + (errors == null ? "" : ",\"errors\":" + errors)
            + "}";
    return mvc.perform(
        post("/api/v1/problems/" + EASY + "/code")
            .with(player)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body));
  }

  private ResultActions java(String code) throws Exception {
    return mvc.perform(
        post("/api/v1/problems/" + EASY + "/code")
            .with(player)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"language\":\"java\",\"code\":\"" + code + "\"}"));
  }

  @Test
  void theSetupSendsTestInputsButNeverTheExpectedOutputs() throws Exception {
    mvc.perform(get("/api/v1/problems/" + EASY + "/code").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.functionName").value("solve"))
        .andExpect(jsonPath("$.inputs.length()").value(8))
        .andExpect(jsonPath("$.inputs[0][0][1]").value(1))
        .andExpect(jsonPath("$.solved").value(false))
        .andExpect(jsonPath("$.javaRunsLeft").value(3))
        .andExpect(content().string(Matchers.not(Matchers.containsString("expected"))));
  }

  @Test
  void codeNeedsASolvedExplanationFirst() throws Exception {
    javascript(RIGHT, null)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.title").value("Explain first"));
  }

  @Test
  void passingJavascriptDoublesTheXpOnce() throws Exception {
    solveExplanation();

    javascript("[1,2,3,4,5,6,7,99]", null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.passed").value(7))
        .andExpect(jsonPath("$.total").value(8))
        .andExpect(jsonPath("$.failedInput").isArray())
        .andExpect(jsonPath("$.failedOutput").value("99"))
        .andExpect(jsonPath("$.xpGained").value(0));
    javascript(RIGHT, "[null,null,null,null,null,null,null,\"TypeError: x is undefined\"]")
        .andExpect(jsonPath("$.passed").value(7))
        .andExpect(jsonPath("$.failedError").value("TypeError: x is undefined"));

    // 9.0 equals 9: numbers compare by value.
    javascript("[1,2,3,4,5,6,7,8.0]", null)
        .andExpect(jsonPath("$.passed").value(8))
        .andExpect(jsonPath("$.xpGained").value(20))
        .andExpect(jsonPath("$.codeBonusAwarded").value(true))
        .andExpect(jsonPath("$.levelXp").value(40));
    javascript(RIGHT, null).andExpect(jsonPath("$.xpGained").value(0));

    mvc.perform(get("/api/v1/levels").with(player)).andExpect(jsonPath("$[0].xp").value(40));
    Integer runs = jdbc.queryForObject("select count(*) from code_run", Integer.class);
    assertThat(runs).isEqualTo(4);
  }

  @Test
  void invalidSubmissionsAreRefused() throws Exception {
    solveExplanation();

    javascript("[1,2]", null).andExpect(status().isBadRequest());
    mvc.perform(
            post("/api/v1/problems/" + EASY + "/code")
                .with(player)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"language\":\"python\",\"code\":\"x\"}"))
        .andExpect(status().isBadRequest());
    java("   ").andExpect(status().isBadRequest());
  }

  @Test
  void javaRunsOnTheRunnerWithinTheDailyQuota() throws Exception {
    solveExplanation();

    java("class Solution { COMPILE-ERROR }")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.compileError").value(Matchers.containsString("expected")))
        .andExpect(jsonPath("$.passed").value(0))
        .andExpect(jsonPath("$.javaRunsLeft").value(2));
    java("class Solution { FAIL }")
        .andExpect(jsonPath("$.passed").value(7))
        .andExpect(jsonPath("$.failedOutput").value("\"wrong\""));
    java("class Solution { RUNNER-DOWN }")
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.title").value("Java runner unavailable"));

    // Three runs reached the runner today; the limit is 3.
    java("class Solution { }")
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.title").value("Java runs used up"));
    // JavaScript still works.
    javascript(RIGHT, null).andExpect(jsonPath("$.xpGained").value(20));
  }
}
