package com.algoquest.notes;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** The note table (D-074). Every query is scoped to the note's owner. */
@Repository
public class NoteStore {

  /** A stored note. */
  public record StoredNote(
      UUID id,
      String title,
      String body,
      String bodyText,
      List<String> tags,
      Integer level,
      Instant createdAt,
      Instant updatedAt) {}

  /** The fields a save writes. */
  public record Fields(
      String title, String body, String bodyText, List<String> tags, Integer level) {}

  static final int MAX_NOTES_LISTED = 1000;

  private final JdbcTemplate jdbc;

  public NoteStore(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public UUID insert(UUID userId, Fields fields, Instant at) {
    UUID id = UUID.randomUUID();
    jdbc.update(
        connection -> {
          var statement =
              connection.prepareStatement(
                  "insert into note (id, user_id, title, body, body_text, tags, level_number,"
                      + " created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)");
          statement.setObject(1, id);
          statement.setObject(2, userId);
          statement.setString(3, fields.title());
          statement.setString(4, fields.body());
          statement.setString(5, fields.bodyText());
          statement.setArray(6, connection.createArrayOf("text", fields.tags().toArray()));
          statement.setObject(7, fields.level());
          statement.setTimestamp(8, Timestamp.from(at));
          statement.setTimestamp(9, Timestamp.from(at));
          return statement;
        });
    return id;
  }

  /** Updates a note the user owns; false when there is none. */
  public boolean update(UUID userId, UUID id, Fields fields, Instant at) {
    int rows =
        jdbc.update(
            connection -> {
              var statement =
                  connection.prepareStatement(
                      "update note set title = ?, body = ?, body_text = ?, tags = ?,"
                          + " level_number = ?, updated_at = ? where id = ? and user_id = ?");
              statement.setString(1, fields.title());
              statement.setString(2, fields.body());
              statement.setString(3, fields.bodyText());
              statement.setArray(4, connection.createArrayOf("text", fields.tags().toArray()));
              statement.setObject(5, fields.level());
              statement.setTimestamp(6, Timestamp.from(at));
              statement.setObject(7, id);
              statement.setObject(8, userId);
              return statement;
            });
    return rows == 1;
  }

  public boolean delete(UUID userId, UUID id) {
    return jdbc.update("delete from note where id = ? and user_id = ?", id, userId) == 1;
  }

  public Optional<StoredNote> find(UUID userId, UUID id) {
    return jdbc
        .query(
            "select * from note where id = ? and user_id = ?", NoteStore::read, id, userId)
        .stream()
        .findFirst();
  }

  /**
   * The user's notes, newest change first. {@code query} matches the title or the text (case
   * ignored); {@code tag} and {@code level} narrow the list when set.
   */
  public List<StoredNote> list(UUID userId, String query, String tag, Integer level) {
    StringBuilder sql = new StringBuilder("select * from note where user_id = ?");
    List<Object> args = new ArrayList<>(List.of(userId));
    if (query != null && !query.isBlank()) {
      String like = "%" + escapeLike(query.trim()) + "%";
      sql.append(" and (title ilike ? escape '\\' or body_text ilike ? escape '\\')");
      args.add(like);
      args.add(like);
    }
    if (tag != null && !tag.isBlank()) {
      sql.append(" and ? = any(tags)");
      args.add(tag.trim());
    }
    if (level != null) {
      sql.append(" and level_number = ?");
      args.add(level);
    }
    sql.append(" order by updated_at desc limit ").append(MAX_NOTES_LISTED);
    return jdbc.query(sql.toString(), NoteStore::read, args.toArray());
  }

  private static String escapeLike(String text) {
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
  }

  private static StoredNote read(ResultSet row, int index) throws SQLException {
    Array tags = row.getArray("tags");
    Object level = row.getObject("level_number");
    return new StoredNote(
        row.getObject("id", UUID.class),
        row.getString("title"),
        row.getString("body"),
        row.getString("body_text"),
        tags == null ? List.of() : Arrays.asList((String[]) tags.getArray()),
        level == null ? null : ((Number) level).intValue(),
        row.getTimestamp("created_at").toInstant(),
        row.getTimestamp("updated_at").toInstant());
  }
}
