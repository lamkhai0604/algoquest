package com.algoquest.notes;

import com.algoquest.content.ContentCatalog;
import com.algoquest.notes.NoteStore.Fields;
import com.algoquest.notes.NoteStore.StoredNote;
import com.algoquest.shared.web.ApiException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Personal notes (D-074): checks what a save contains and builds the Markdown export. */
@Service
public class NoteService {

  static final int MAX_TITLE = 200;
  static final int MAX_BODY = 200_000;
  static final int MAX_TEXT = 100_000;
  static final int MAX_TAGS = 10;
  static final int MAX_TAG = 30;
  static final int SNIPPET = 220;
  private static final Pattern TAG = Pattern.compile("[\\p{L}\\p{N}][\\p{L}\\p{N} ._+#-]*");
  private static final JsonMapper JSON = JsonMapper.builder().build();

  /** What the editor sends: the document as JSON, and its plain text. */
  public record NoteRequest(
      String title, JsonNode body, String bodyText, List<String> tags, Integer level) {}

  /** A note in the list: no document, a short preview instead. */
  public record NoteSummary(
      UUID id, String title, String snippet, List<String> tags, Integer level, Instant updatedAt) {}

  /** A whole note, for the editor. */
  public record NoteView(
      UUID id,
      String title,
      JsonNode body,
      List<String> tags,
      Integer level,
      Instant createdAt,
      Instant updatedAt) {}

  private final NoteStore notes;
  private final ContentCatalog content;
  private final Clock clock;

  public NoteService(NoteStore notes, ContentCatalog content, Clock clock) {
    this.notes = notes;
    this.content = content;
    this.clock = clock;
  }

  public List<NoteSummary> list(UUID userId, String query, String tag, Integer level) {
    return notes.list(userId, query, tag, level).stream()
        .map(
            note ->
                new NoteSummary(
                    note.id(),
                    note.title(),
                    snippet(note.bodyText()),
                    note.tags(),
                    note.level(),
                    note.updatedAt()))
        .toList();
  }

  public NoteView get(UUID userId, UUID id) {
    return view(notes.find(userId, id).orElseThrow(NoteService::notFound));
  }

  public NoteView create(UUID userId, NoteRequest request) {
    UUID id = notes.insert(userId, fields(request), clock.instant());
    return get(userId, id);
  }

  public NoteView update(UUID userId, UUID id, NoteRequest request) {
    if (!notes.update(userId, id, fields(request), clock.instant())) {
      throw notFound();
    }
    return get(userId, id);
  }

  public void delete(UUID userId, UUID id) {
    if (!notes.delete(userId, id)) {
      throw notFound();
    }
  }

  /** Every note as a Markdown file, in one zip; file names follow the titles. */
  public byte[] export(UUID userId) {
    ByteArrayOutputStream bytes = new ByteArrayOutputStream();
    Map<String, Integer> used = new HashMap<>();
    try (ZipOutputStream zip = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
      for (StoredNote note : notes.list(userId, null, null, null)) {
        String base = fileName(note.title());
        int seen = used.merge(base, 1, Integer::sum);
        String name = seen == 1 ? base + ".md" : base + "-" + seen + ".md";
        zip.putNextEntry(new ZipEntry(name));
        JsonNode doc = JSON.readTree(note.body());
        zip.write(
            NoteMarkdown.of(note.title(), note.tags(), note.level(), doc)
                .getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
      }
    } catch (IOException e) {
      throw new IllegalStateException("Could not build the notes export", e);
    }
    return bytes.toByteArray();
  }

  static String fileName(String title) {
    String name =
        java.text.Normalizer.normalize(title, java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .replace('đ', 'd')
            .replace('Đ', 'D')
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-+|-+$)", "");
    if (name.length() > 60) {
      name = name.substring(0, 60).replaceAll("-+$", "");
    }
    return name.isEmpty() ? "note" : name;
  }

  private Fields fields(NoteRequest request) {
    String title = request.title() == null ? "" : request.title().strip();
    if (title.isEmpty() || title.length() > MAX_TITLE) {
      throw invalid("A title needs 1 to " + MAX_TITLE + " characters.");
    }
    JsonNode body = request.body();
    if (body == null || !body.isObject() || !"doc".equals(body.path("type").asString(""))) {
      throw invalid("The body must be an editor document.");
    }
    if (!safeLinks(body)) {
      throw invalid("Links must start with http://, https:// or mailto:.");
    }
    String bodyJson;
    try {
      bodyJson = JSON.writeValueAsString(body);
    } catch (JacksonException e) {
      throw invalid("The body must be an editor document.");
    }
    if (bodyJson.length() > MAX_BODY) {
      throw invalid("The note is too long.");
    }
    String text = request.bodyText() == null ? "" : request.bodyText();
    if (text.length() > MAX_TEXT) {
      throw invalid("The note is too long.");
    }
    LinkedHashSet<String> tags = new LinkedHashSet<>();
    for (String raw : request.tags() == null ? List.<String>of() : request.tags()) {
      String tag = raw == null ? "" : raw.strip().toLowerCase(Locale.ROOT);
      if (tag.isEmpty() || tag.length() > MAX_TAG || !TAG.matcher(tag).matches()) {
        throw invalid("A tag needs 1 to " + MAX_TAG + " letters, digits, spaces or . _ + # -.");
      }
      tags.add(tag);
    }
    if (tags.size() > MAX_TAGS) {
      throw invalid("A note has at most " + MAX_TAGS + " tags.");
    }
    Integer level = request.level();
    if (level != null && content.level(level).isEmpty()) {
      throw invalid("There is no level " + level + ".");
    }
    return new Fields(title, bodyJson, text, new ArrayList<>(tags), level);
  }

  private static final Pattern SAFE_LINK =
      Pattern.compile("(?i)(https?://|mailto:)[^\\s]*");

  /** Every link mark in the document points to a web page or an email address. */
  static boolean safeLinks(JsonNode node) {
    for (JsonNode mark : node.path("marks")) {
      if ("link".equals(mark.path("type").asString(""))) {
        String href = mark.path("attrs").path("href").asString("");
        if (!SAFE_LINK.matcher(href).matches()) {
          return false;
        }
      }
    }
    for (JsonNode child : node.path("content")) {
      if (!safeLinks(child)) {
        return false;
      }
    }
    return true;
  }

  private static NoteView view(StoredNote note) {
    try {
      return new NoteView(
          note.id(),
          note.title(),
          JSON.readTree(note.body()),
          note.tags(),
          note.level(),
          note.createdAt(),
          note.updatedAt());
    } catch (JacksonException e) {
      throw new IllegalStateException("A stored note is not valid JSON", e);
    }
  }

  static String snippet(String text) {
    String flat = text.replaceAll("\\s+", " ").strip();
    return flat.length() <= SNIPPET ? flat : flat.substring(0, SNIPPET).stripTrailing() + "…";
  }

  private static ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, "Note not found", "There is no such note.");
  }

  private static ApiException invalid(String detail) {
    return new ApiException(HttpStatus.BAD_REQUEST, "Invalid note", detail);
  }
}
