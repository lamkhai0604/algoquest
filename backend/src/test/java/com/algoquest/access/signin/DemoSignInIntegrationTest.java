package com.algoquest.access.signin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest(
    properties = {
      "algoquest.jwt-secret=integration-test-secret-of-32-characters",
      "algoquest.demo.enabled=true",
      "algoquest.demo.daily-limit=2"
    })
@ActiveProfiles("test")
@Transactional
class DemoSignInIntegrationTest {

  @Autowired private WebApplicationContext context;

  private MockMvc mvc;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
  }

  private String demoCode() throws Exception {
    String body =
        mvc.perform(post("/api/v1/auth/demo"))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return body.replaceAll(".*\"code\":\"([^\"]+)\".*", "$1");
  }

  private String token(String code) throws Exception {
    String body =
        mvc.perform(
                post("/api/v1/auth/exchange")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"code\":\"" + code + "\"}"))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return body.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
  }

  @Test
  void optionsAreOpenAndShowTheDemo() throws Exception {
    mvc.perform(get("/api/v1/auth/options"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.demo").value(true))
        .andExpect(jsonPath("$.password").value(false));
  }

  @Test
  void aDemoAccountPlaysEveryLevelAndTheDailyCapHolds() throws Exception {
    String first = token(demoCode());
    mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + first))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName").value("Demo visitor"))
        .andExpect(jsonPath("$.roles[?(@ == 'DEMO')]").exists())
        .andExpect(jsonPath("$.permissions[?(@ == 'game.allLevels')]").exists());

    String second = token(demoCode());
    assertThat(second).isNotEqualTo(first);

    mvc.perform(post("/api/v1/auth/demo"))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.title").value("Demo limit reached"));
  }
}
