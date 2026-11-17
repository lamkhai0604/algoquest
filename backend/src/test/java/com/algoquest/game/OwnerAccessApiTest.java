package com.algoquest.game;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

/** The Owner can open every available level, problem, and test for testing (D-055). */
@SpringBootTest(
    properties = {
      "algoquest.content.location=classpath:content-fixtures/valid/",
      "algoquest.owner-email=owner@example.com"
    })
@ActiveProfiles("test")
@Transactional
class OwnerAccessApiTest {

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;

  private MockMvc mvc;
  private RequestPostProcessor owner;
  private RequestPostProcessor player;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    owner = as(signIn("owner@example.com"));
    player = as(signIn("player@example.com"));
  }

  private UUID signIn(String email) {
    return access.signIn(new SignInProfile("github", "id-" + email, email, "Someone"));
  }

  private static RequestPostProcessor as(UUID id) {
    return authentication(
        new UsernamePasswordAuthenticationToken(new AuthenticatedUser(id), null, List.of()));
  }

  @Test
  void theOwnerSeesEveryRoundOpenWithNoProgress() throws Exception {
    mvc.perform(get("/api/v1/levels").with(owner))
        .andExpect(jsonPath("$[0].state").value("OPEN"))
        .andExpect(jsonPath("$[0].xp").value(0))
        .andExpect(jsonPath("$[0].practiceOpen").value(true))
        .andExpect(jsonPath("$[0].testOpen").value(true));
    mvc.perform(get("/api/v1/levels").with(player))
        .andExpect(jsonPath("$[0].practiceOpen").value(false))
        .andExpect(jsonPath("$[0].testOpen").value(false));
  }

  @Test
  void theOwnerCanOpenAProblemOutOfOrder() throws Exception {
    mvc.perform(get("/api/v1/levels/1/problems").with(owner))
        .andExpect(jsonPath("$[1].id").value("L1-pair-max"))
        .andExpect(jsonPath("$[1].locked").value(false));
    mvc.perform(get("/api/v1/problems/L1-pair-max").with(owner)).andExpect(status().isOk());
    mvc.perform(get("/api/v1/problems/L1-pair-max").with(player)).andExpect(status().isForbidden());
  }

  @Test
  void theOwnerCanStartALevelTestBeforeTheBarIsFull() throws Exception {
    mvc.perform(post("/api/v1/levels/1/tests").with(owner)).andExpect(status().isOk());
    mvc.perform(post("/api/v1/levels/1/tests").with(player)).andExpect(status().isForbidden());
  }
}
