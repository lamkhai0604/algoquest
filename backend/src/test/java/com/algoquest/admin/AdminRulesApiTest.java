package com.algoquest.admin;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/** Game rules editor, roles, and audit log (FR-17.6, FR-18.3, FR-18.4, D-047). */
@SpringBootTest(
    properties = {
      "algoquest.content.location=classpath:content-fixtures/valid/",
      "algoquest.owner-email=owner@example.com"
    })
@ActiveProfiles("test")
@Transactional
class AdminRulesApiTest {

  private static final String GOOD =
      "Walk through the array once and keep the largest value seen so far; O(n) time.";
  private static final String DEFAULTS =
      "{\"baseXp\":15,\"mediumBonus\":9,\"hardBonus\":20,\"timeBonus\":5,\"easyMinutes\":15,"
          + "\"mediumMinutes\":25,\"hardMinutes\":40,\"hintPenaltyPercent\":20,"
          + "\"hintsPerWindow\":3,\"hintWindowHours\":5,\"passScore\":70,"
          + "\"practiceOpenPercent\":70,\"practiceDoneXp\":10,\"quickCheckXp\":5,"
          + "\"levelTarget\":150}";

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;

  private MockMvc mvc;
  private UUID ownerId;
  private RequestPostProcessor owner;
  private UUID playerId;
  private RequestPostProcessor player;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    ownerId = signIn("owner@example.com");
    owner = as(ownerId);
    playerId = signIn("player@example.com");
    player = as(playerId);
  }

  private UUID signIn(String email) {
    return access.signIn(new SignInProfile("github", "id-" + email, email, email));
  }

  private static RequestPostProcessor as(UUID id) {
    return authentication(
        new UsernamePasswordAuthenticationToken(new AuthenticatedUser(id), null, List.of()));
  }

  private ResultActions putRules(RequestPostProcessor who, String json) throws Exception {
    return mvc.perform(
        put("/api/v1/admin/game-rules")
            .with(who)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json));
  }

  @Test
  void playersReadTheRulesAndOnlyTheOwnerChangesThem() throws Exception {
    mvc.perform(get("/api/v1/rules").with(player))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.baseXp").value(15))
        .andExpect(jsonPath("$.levelTarget").value(150));
    mvc.perform(get("/api/v1/admin/game-rules").with(player)).andExpect(status().isForbidden());
    putRules(player, DEFAULTS).andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/admin/game-rules").with(owner))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.defaults.passScore").value(70));
  }

  @Test
  void aChangeAppliesOnTheNextRequestAndIsAuditLogged() throws Exception {
    putRules(owner, DEFAULTS.replace("\"baseXp\":15", "\"baseXp\":30"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.current.baseXp").value(30));

    mvc.perform(
            post("/api/v1/problems/L1-max-value/attempts")
                .with(player)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"attemptId\":\"%s\",\"text\":\"%s\"}".formatted(UUID.randomUUID(), GOOD)))
        .andExpect(jsonPath("$.xpGained").value(35)); // 30 + 5 time bonus

    mvc.perform(get("/api/v1/admin/audit-log").with(owner))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].action").value("config.update"))
        .andExpect(jsonPath("$[0].actorEmail").value("owner@example.com"))
        .andExpect(jsonPath("$[0].before").value("{\"baseXp\":\"15\"}"))
        .andExpect(jsonPath("$[0].after").value("{\"baseXp\":\"30\"}"));
    mvc.perform(get("/api/v1/admin/audit-log").with(player)).andExpect(status().isForbidden());
  }

  @Test
  void valuesThatBreakTheRulesAreRefused() throws Exception {
    putRules(owner, DEFAULTS.replace("\"passScore\":70", "\"passScore\":120"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.detail").value(Matchers.containsString("passScore")));
    putRules(owner, DEFAULTS.replace("\"easyMinutes\":15", "\"easyMinutes\":30"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.detail").value(Matchers.containsString("Time limits")));
    mvc.perform(get("/api/v1/rules").with(player)).andExpect(jsonPath("$.passScore").value(70));
  }

  @Test
  void theOwnerGrantsAndRemovesRolesButNeverTheLastOwner() throws Exception {
    mvc.perform(
            post("/api/v1/admin/users/" + playerId + "/roles")
                .with(owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"ADMIN\"}"))
        .andExpect(status().isOk())
        .andExpect(
            jsonPath("$[?(@.email=='player@example.com')].roles[*]")
                .value(Matchers.hasItem("ADMIN")));
    mvc.perform(delete("/api/v1/admin/users/" + playerId + "/roles/ADMIN").with(owner))
        .andExpect(status().isOk())
        .andExpect(
            jsonPath("$[?(@.email=='player@example.com')].roles[*]")
                .value(Matchers.not(Matchers.hasItem("ADMIN"))));
    mvc.perform(delete("/api/v1/admin/users/" + ownerId + "/roles/OWNER").with(owner))
        .andExpect(status().isConflict());
    mvc.perform(
            post("/api/v1/admin/users/" + ownerId + "/roles")
                .with(player)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"PLAYER\"}"))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/admin/audit-log").with(owner))
        .andExpect(jsonPath("$[0].action").value("role.remove"))
        .andExpect(jsonPath("$[0].targetEmail").value("player@example.com"));
  }
}
