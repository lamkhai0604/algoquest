package com.algoquest.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.algoquest.access.AccessService;
import com.algoquest.access.AuthenticatedUser;
import com.algoquest.access.SignInProfile;
import com.algoquest.access.persistence.AuditLogEntry;
import com.algoquest.access.persistence.AuditLogRepository;
import java.util.List;
import java.util.UUID;
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

/** Grading log and progress reset (FR-18.1, FR-18.2), with the fake grader. */
@SpringBootTest(
    properties = {
      "algoquest.content.location=classpath:content-fixtures/valid/",
      "algoquest.owner-email=owner@example.com"
    })
@ActiveProfiles("test")
@Transactional
class AdminGameApiTest {

  private static final String GOOD =
      "Walk through the array once and keep the largest value seen so far; O(n) time.";

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;
  @Autowired private AuditLogRepository auditLog;
  @Autowired private JdbcTemplate jdbc;

  private MockMvc mvc;
  private RequestPostProcessor owner;
  private UUID playerId;
  private RequestPostProcessor player;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    owner = as(signIn("owner@example.com"));
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

  private void solve(String problem, String text) throws Exception {
    mvc.perform(
            post("/api/v1/problems/" + problem + "/attempts")
                .with(player)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"attemptId\":\"%s\",\"text\":\"%s\"}".formatted(UUID.randomUUID(), text)))
        .andExpect(status().isOk());
  }

  private ResultActions reset(RequestPostProcessor who, UUID user, int level) throws Exception {
    return mvc.perform(
        post("/api/v1/admin/users/" + user + "/progress-reset")
            .with(who)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"level\":" + level + "}"));
  }

  @Test
  void theGradingLogListsAttemptsNewestFirstAndFiltersByProblem() throws Exception {
    solve("L1-max-value", "Sort it.");
    solve("L1-pair-max", GOOD);

    mvc.perform(get("/api/v1/admin/attempts").with(owner))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].problemId").value("L1-pair-max"))
        .andExpect(jsonPath("$[0].userEmail").value("player@example.com"))
        .andExpect(jsonPath("$[0].explanation").value(GOOD))
        .andExpect(jsonPath("$[0].total").value(95))
        .andExpect(jsonPath("$[0].grader").value("fake"));
    mvc.perform(get("/api/v1/admin/attempts").param("problemId", "L1-max-value").with(owner))
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].total").value(35));
  }

  @Test
  void resettingALevelStartsItOverAndIsAudited() throws Exception {
    solve("L1-max-value", GOOD);
    mvc.perform(post("/api/v1/problems/L1-pair-max/hints").with(player)).andExpect(status().isOk());

    reset(owner, playerId, 1)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.before.xp").value(25))
        .andExpect(jsonPath("$.before.solved").value(1))
        .andExpect(jsonPath("$.after.xp").value(0))
        .andExpect(jsonPath("$.after.solved").value(0));

    mvc.perform(get("/api/v1/levels").with(player)).andExpect(jsonPath("$[0].xp").value(0));
    mvc.perform(get("/api/v1/problems/L1-pair-max/hints").with(player))
        .andExpect(jsonPath("$.opened.length()").value(0));
    Integer attempts = jdbc.queryForObject("select count(*) from attempt", Integer.class);
    assertThat(attempts).isEqualTo(1);

    List<AuditLogEntry> entries =
        auditLog.findAllByOrderByAtDesc().stream()
            .filter(e -> e.getAction().equals("progress.reset"))
            .toList();
    assertThat(entries).hasSize(1);
    assertThat(entries.get(0).getTarget()).isEqualTo("user:" + playerId);
    assertThat(entries.get(0).getBeforeValue()).contains("\"xp\":\"25\"");
    assertThat(entries.get(0).getAfterValue()).contains("\"xp\":\"0\"");
  }

  @Test
  void playersCannotUseTheAdminEndpoints() throws Exception {
    mvc.perform(get("/api/v1/admin/attempts").with(player)).andExpect(status().isForbidden());
    reset(player, playerId, 1).andExpect(status().isForbidden());
    assertThat(auditLog.findAllByOrderByAtDesc())
        .noneMatch(e -> e.getAction().equals("progress.reset"));
  }

  @Test
  void unknownUsersAndLevelsAreRejected() throws Exception {
    reset(owner, UUID.randomUUID(), 1).andExpect(status().isNotFound());
    reset(owner, playerId, 99).andExpect(status().isBadRequest());
  }
}
