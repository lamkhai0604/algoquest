package com.algoquest.pattern;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Pattern Recognition answers (D-057). */
@Repository
public class PatternStore {

  /** One stored answer, for the Owner's review list. */
  public record StoredAnswer(
      UUID id,
      String player,
      String challengeId,
      String approachId,
      String label,
      String explanation,
      int reasonScore,
      int complexity,
      String feedback,
      String grader,
      int gradingMs,
      Instant at) {}

  private final JdbcTemplate jdbc;

  public PatternStore(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public void save(
      UUID userId,
      String challengeId,
      String approachId,
      String label,
      String explanation,
      int reasonScore,
      int complexity,
      String feedback,
      String grader,
      int gradingMs,
      Instant at) {
    jdbc.update(
        "insert into pattern_attempt (id, user_id, challenge_id, approach_id, label, explanation,"
            + " reason_score, complexity, feedback, grader, grading_ms, created_at)"
            + " values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        UUID.randomUUID(),
        userId,
        challengeId,
        approachId,
        label,
        explanation,
        reasonScore,
        complexity,
        feedback,
        grader,
        gradingMs,
        Timestamp.from(at));
  }

  /** The player's answers to one challenge since midnight UTC. */
  public int countToday(UUID userId, String challengeId, Instant now) {
    Instant midnight = now.atOffset(ZoneOffset.UTC).truncatedTo(ChronoUnit.DAYS).toInstant();
    Integer count =
        jdbc.queryForObject(
            "select count(*) from pattern_attempt"
                + " where user_id = ? and challenge_id = ? and created_at >= ?",
            Integer.class,
            userId,
            challengeId,
            Timestamp.from(midnight));
    return count == null ? 0 : count;
  }

  /** The best label each challenge has received from this player: best, then valid, then unsuitable. */
  public Map<String, String> bestLabels(UUID userId) {
    Map<String, String> best = new HashMap<>();
    jdbc.query(
        "select challenge_id, label from pattern_attempt where user_id = ?",
        rs -> {
          String id = rs.getString("challenge_id");
          String label = rs.getString("label");
          if (rank(label) > rank(best.get(id))) {
            best.put(id, label);
          }
        },
        userId);
    return best;
  }

  /** The newest answers from every player, for the Owner's review (newest first). */
  public List<StoredAnswer> recent(int limit) {
    return jdbc.query(
        "select a.*, u.display_name from pattern_attempt a join app_user u on u.id = a.user_id"
            + " order by a.created_at desc limit ?",
        (rs, row) ->
            new StoredAnswer(
                rs.getObject("id", UUID.class),
                rs.getString("display_name"),
                rs.getString("challenge_id"),
                rs.getString("approach_id"),
                rs.getString("label"),
                rs.getString("explanation"),
                rs.getInt("reason_score"),
                rs.getInt("complexity"),
                rs.getString("feedback"),
                rs.getString("grader"),
                rs.getInt("grading_ms"),
                rs.getTimestamp("created_at").toInstant()),
        limit);
  }

  static int rank(String label) {
    if (label == null) {
      return 0;
    }
    return switch (label) {
      case "best" -> 3;
      case "valid" -> 2;
      default -> 1;
    };
  }
}
