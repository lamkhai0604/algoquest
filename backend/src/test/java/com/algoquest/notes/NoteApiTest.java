package com.algoquest.notes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.algoquest.access.AccessService;
import com.algoquest.access.AuthenticatedUser;
import com.algoquest.access.SignInProfile;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
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

/** Personal notes (D-074, T-606): only the Owner, only their own notes. */
@SpringBootTest(
    properties = {
      "algoquest.content.location=classpath:content-fixtures/valid/",
      "algoquest.owner-email=owner@example.com"
    })
@ActiveProfiles("test")
@Transactional
class NoteApiTest {

  private static final String DOC =
      "{\"type\":\"doc\",\"content\":["
          + "{\"type\":\"heading\",\"attrs\":{\"level\":2},\"content\":[{\"type\":\"text\","
          + "\"text\":\"Idea\"}]},"
          + "{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Keep a \"},"
          + "{\"type\":\"text\",\"marks\":[{\"type\":\"bold\"}],\"text\":\"decreasing\"},"
          + "{\"type\":\"text\",\"text\":\" stack.\"}]},"
          + "{\"type\":\"bulletList\",\"content\":[{\"type\":\"listItem\",\"content\":["
          + "{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"pop smaller\"}]}"
          + "]}]}]}";

  @Autowired private WebApplicationContext context;
  @Autowired private AccessService access;
  @Autowired private NoteStore store;

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

  private static String note(String title, String body, String tags, String level) {
    return "{\"title\":\""
        + title
        + "\",\"body\":"
        + body
        + ",\"bodyText\":\"Idea Keep a decreasing stack. pop smaller\",\"tags\":"
        + tags
        + ",\"level\":"
        + level
        + "}";
  }

  private ResultActions create(RequestPostProcessor who, String json) throws Exception {
    return mvc.perform(
        post("/api/v1/notes").with(who).contentType(MediaType.APPLICATION_JSON).content(json));
  }

  private String createdId(String json) throws Exception {
    String body =
        create(owner, json).andExpect(status().isCreated()).andReturn().getResponse()
            .getContentAsString();
    return body.replaceAll("^\\{\"id\":\"([^\"]+)\".*$", "$1");
  }

  @Test
  void theOwnerWritesFindsChangesAndDeletesANote() throws Exception {
    String id = createdId(note("  Monotonic stack ", DOC, "[\" Stack \",\"stack\",\"pattern\"]", "1"));

    mvc.perform(get("/api/v1/notes/" + id).with(owner))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Monotonic stack"))
        .andExpect(jsonPath("$.tags", Matchers.contains("stack", "pattern")))
        .andExpect(jsonPath("$.level").value(1))
        .andExpect(jsonPath("$.body.content[1].content[1].marks[0].type").value("bold"));

    mvc.perform(get("/api/v1/notes").with(owner))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].snippet").value("Idea Keep a decreasing stack. pop smaller"))
        .andExpect(jsonPath("$[0].body").doesNotExist());
    mvc.perform(get("/api/v1/notes").param("q", "DECREASING").with(owner))
        .andExpect(jsonPath("$", Matchers.hasSize(1)));
    mvc.perform(get("/api/v1/notes").param("q", "100%").with(owner))
        .andExpect(jsonPath("$", Matchers.hasSize(0)));
    mvc.perform(get("/api/v1/notes").param("tag", "pattern").with(owner))
        .andExpect(jsonPath("$", Matchers.hasSize(1)));
    mvc.perform(get("/api/v1/notes").param("level", "2").with(owner))
        .andExpect(jsonPath("$", Matchers.hasSize(0)));

    mvc.perform(
            put("/api/v1/notes/" + id)
                .with(owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content(note("Monotonic stack, revised", DOC, "[]", "null")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Monotonic stack, revised"))
        .andExpect(jsonPath("$.tags", Matchers.hasSize(0)))
        .andExpect(jsonPath("$.level").doesNotExist());

    mvc.perform(delete("/api/v1/notes/" + id).with(owner)).andExpect(status().isNoContent());
    mvc.perform(get("/api/v1/notes/" + id).with(owner)).andExpect(status().isNotFound());
  }

  @Test
  void playersHaveNoNotes() throws Exception {
    mvc.perform(get("/api/v1/notes").with(player)).andExpect(status().isForbidden());
    create(player, note("Mine", DOC, "[]", "null")).andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/notes/export").with(player)).andExpect(status().isForbidden());
  }

  @Test
  void aNoteOfAnotherAccountIsNeverShown() throws Exception {
    UUID theirs =
        store.insert(
            playerId,
            new NoteStore.Fields("Private", "{\"type\":\"doc\"}", "secret", List.of(), null),
            Instant.now());

    mvc.perform(get("/api/v1/notes/" + theirs).with(owner)).andExpect(status().isNotFound());
    mvc.perform(delete("/api/v1/notes/" + theirs).with(owner)).andExpect(status().isNotFound());
    mvc.perform(get("/api/v1/notes").with(owner)).andExpect(jsonPath("$", Matchers.hasSize(0)));
    assertThat(store.find(playerId, theirs)).isPresent();
  }

  @Test
  void badNotesAreRefused() throws Exception {
    create(owner, note(" ", DOC, "[]", "null"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.detail").value(Matchers.containsString("title")));
    create(owner, note("T", "{\"type\":\"paragraph\"}", "[]", "null"))
        .andExpect(status().isBadRequest());
    create(owner, note("T", DOC, "[]", "99"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.detail").value("There is no level 99."));
    create(owner, note("T", DOC, "[\"a\",\"b\",\"c\",\"d\",\"e\",\"f\",\"g\",\"h\",\"i\",\"j\",\"k\"]", "null"))
        .andExpect(status().isBadRequest());
    create(owner, note("T", DOC, "[\"<b>\"]", "null")).andExpect(status().isBadRequest());
    String unsafe =
        "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\","
            + "\"text\":\"x\",\"marks\":[{\"type\":\"link\",\"attrs\":{\"href\":"
            + "\"javascript:alert(1)\"}}]}]}]}";
    create(owner, note("T", unsafe, "[]", "null"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.detail").value(Matchers.containsString("Links")));
  }

  @Test
  void theExportIsAZipOfMarkdownFiles() throws Exception {
    createdId(note("Monotonic stack", DOC, "[\"stack\"]", "1"));
    createdId(note("Monotonic stack", DOC, "[]", "null"));
    createdId(note("Đồ thị: BFS", DOC, "[]", "null"));

    byte[] zip =
        mvc.perform(get("/api/v1/notes/export").with(owner))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", "application/zip"))
            .andExpect(
                header().string("Content-Disposition", Matchers.containsString("algoquest-notes.zip")))
            .andReturn()
            .getResponse()
            .getContentAsByteArray();

    Map<String, String> files = new HashMap<>();
    try (ZipInputStream in = new ZipInputStream(new ByteArrayInputStream(zip))) {
      for (ZipEntry entry; (entry = in.getNextEntry()) != null; ) {
        files.put(entry.getName(), new String(in.readAllBytes(), StandardCharsets.UTF_8));
      }
    }
    assertThat(files)
        .containsOnlyKeys("monotonic-stack.md", "monotonic-stack-2.md", "do-thi-bfs.md");
    assertThat(files.values())
        .contains(
            "# Monotonic stack\n\nLevel 1 · Tags: stack\n\n## Idea\n\n"
                + "Keep a **decreasing** stack.\n\n- pop smaller\n");
  }
}
