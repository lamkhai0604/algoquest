package com.algoquest.design;

import com.algoquest.grading.DesignAnswer;
import com.algoquest.grading.DesignResult;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Graded design prompt answers (D-085). */
@Repository
public class DesignStore {

  /** One stored answer, for the Owner's review list. */
  public record StoredDesign(
      UUID id,
      String player,
      String promptId,
      DesignAnswer answer,
      DesignResult result,
      int total,
      String grader,
      int gradingMs,
      Instant at) {}

  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final TypeReference<LinkedHashMap<String, String>> SECTIONS =
      new TypeReference<>() {};

  private final JdbcTemplate jdbc;

  public DesignStore(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public void save(
      UUID userId,
      String promptId,
      DesignAnswer answer,
      DesignResult result,
      String grader,
      int gradingMs,
      Instant at) {
    jdbc.update(
        "insert into design_attempt (id, user_id, prompt_id, sections, score_requirements,"
            + " score_estimation, score_design, score_data, score_tradeoffs, strengths, improve,"
            + " grader, grading_ms, created_at)"
            + " values (?, ?, ?, cast(? as jsonb), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        UUID.randomUUID(),
        userId,
        promptId,
        JSON.writeValueAsString(answer.sections()),
        result.requirements(),
        result.estimation(),
        result.design(),
        result.data(),
        result.tradeoffs(),
        result.strengths(),
        result.improve(),
        grader,
        gradingMs,
        Timestamp.from(at));
  }

  /** The player's answers to one prompt since midnight UTC. */
  public int countToday(UUID userId, String promptId, Instant now) {
    Instant midnight = now.atOffset(ZoneOffset.UTC).truncatedTo(ChronoUnit.DAYS).toInstant();
    Integer count =
        jdbc.queryForObject(
            "select count(*) from design_attempt"
                + " where user_id = ? and prompt_id = ? and created_at >= ?",
            Integer.class,
            userId,
            promptId,
            Timestamp.from(midnight));
    return count == null ? 0 : count;
  }

  /** The best total score this player has reached on each prompt. */
  public Map<String, Integer> bestScores(UUID userId) {
    Map<String, Integer> best = new HashMap<>();
    jdbc.query(
        "select prompt_id, max("
            + TOTAL
            + ") as best from design_attempt"
            + " where user_id = ? group by prompt_id",
        rs -> {
          best.put(rs.getString("prompt_id"), rs.getInt("best"));
        },
        userId);
    return best;
  }

  /** The newest answers from every player, for the Owner's review (newest first). */
  public List<StoredDesign> recent(int limit) {
    return jdbc.query(
        "select a.*, u.display_name from design_attempt a join app_user u on u.id = a.user_id"
            + " order by a.created_at desc limit ?",
        (rs, row) -> {
          DesignResult result =
              new DesignResult(
                  rs.getInt("score_requirements"),
                  rs.getInt("score_estimation"),
                  rs.getInt("score_design"),
                  rs.getInt("score_data"),
                  rs.getInt("score_tradeoffs"),
                  rs.getString("strengths"),
                  rs.getString("improve"));
          return new StoredDesign(
              rs.getObject("id", UUID.class),
              rs.getString("display_name"),
              rs.getString("prompt_id"),
              answer(
                  rs.getString("sections"),
                  rs.getString("requirements"),
                  rs.getString("estimate"),
                  rs.getString("components"),
                  rs.getString("failure")),
              result,
              result.total(),
              rs.getString("grader"),
              rs.getInt("grading_ms"),
              rs.getTimestamp("created_at").toInstant());
        },
        limit);
  }

  /** The stored sections, or the four columns of answers saved before T-699. */
  private static DesignAnswer answer(
      String sections, String requirements, String estimate, String components, String failure) {
    if (sections != null) {
      return new DesignAnswer(JSON.readValue(sections, SECTIONS));
    }
    Map<String, String> old = new LinkedHashMap<>();
    old.put("requirements", requirements);
    old.put("estimate", estimate);
    old.put("components", components);
    old.put("failure", failure);
    return new DesignAnswer(old);
  }

  private static final String TOTAL =
      "score_requirements + score_estimation + score_design + score_data + score_tradeoffs";
}
