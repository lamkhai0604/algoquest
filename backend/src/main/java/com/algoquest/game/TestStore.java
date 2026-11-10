package com.algoquest.game;

import com.algoquest.grading.GradingResult;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Level-up tests and their answers. Every query is filtered by the player (NFR-02). */
@Repository
public class TestStore {

  /** A test as stored. {@code submittedAt} and {@code score} are null while it runs. */
  public record StoredTest(
      UUID id,
      UUID userId,
      int level,
      List<String> problemIds,
      Instant startedAt,
      Instant endsAt,
      Instant submittedAt,
      Integer score) {}

  /** A saved answer; {@code result} is null until it is graded. */
  public record StoredAnswer(String text, GradingResult result) {}

  private final JdbcTemplate jdbc;

  public TestStore(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  /** The best submitted score per level. */
  public Map<Integer, Integer> bestScores(UUID userId) {
    Map<Integer, Integer> best = new HashMap<>();
    jdbc.query(
        "select level, max(score) as best from test_attempt"
            + " where user_id = ? and submitted_at is not null group by level",
        rs -> {
          best.put(rs.getInt("level"), rs.getInt("best"));
        },
        userId);
    return best;
  }

  public Optional<StoredTest> running(UUID userId) {
    return one("where user_id = ? and submitted_at is null", userId);
  }

  public Optional<StoredTest> find(UUID userId, UUID testId) {
    return one("where user_id = ? and id = ?", userId, testId);
  }

  /** The test, locked until the transaction ends. */
  public Optional<StoredTest> lock(UUID userId, UUID testId) {
    return one("where user_id = ? and id = ? for update", userId, testId);
  }

  public void insert(StoredTest test) {
    jdbc.update(
        "insert into test_attempt (id, user_id, level, problem_ids, started_at, ends_at)"
            + " values (?, ?, ?, ?, ?, ?)",
        test.id(),
        test.userId(),
        test.level(),
        String.join(",", test.problemIds()),
        Timestamp.from(test.startedAt()),
        Timestamp.from(test.endsAt()));
  }

  public void finish(UUID testId, Instant submittedAt, int score) {
    jdbc.update(
        "update test_attempt set submitted_at = ?, score = ? where id = ?",
        Timestamp.from(submittedAt),
        score,
        testId);
  }

  /** Answers keyed by problem ID. */
  public Map<String, StoredAnswer> answers(UUID testId) {
    Map<String, StoredAnswer> answers = new LinkedHashMap<>();
    jdbc.query(
        "select problem_id, explanation, pattern, steps, complexity, edge_cases, feedback"
            + " from test_answer where test_id = ?",
        rs -> {
          Integer pattern = (Integer) rs.getObject("pattern");
          GradingResult result =
              pattern == null
                  ? null
                  : new GradingResult(
                      pattern,
                      rs.getInt("steps"),
                      rs.getInt("complexity"),
                      rs.getInt("edge_cases"),
                      rs.getString("feedback"));
          answers.put(
              rs.getString("problem_id"), new StoredAnswer(rs.getString("explanation"), result));
        },
        testId);
    return answers;
  }

  /** Saves an answer's text; a changed text loses its grade. */
  public void saveAnswer(UUID testId, String problemId, String text, Instant savedAt) {
    jdbc.update(
        "insert into test_answer (test_id, problem_id, explanation, saved_at) values (?, ?, ?, ?)"
            + " on conflict (test_id, problem_id) do update set explanation = excluded.explanation,"
            + " saved_at = excluded.saved_at, pattern = null, steps = null, complexity = null,"
            + " edge_cases = null, total = null, feedback = null"
            + " where test_answer.explanation <> excluded.explanation",
        testId,
        problemId,
        text,
        Timestamp.from(savedAt));
  }

  /** Stores a grade if the answer's text is still the graded text. */
  public void saveGrade(UUID testId, String problemId, String gradedText, GradingResult result) {
    jdbc.update(
        "update test_answer set pattern = ?, steps = ?, complexity = ?, edge_cases = ?,"
            + " total = ?, feedback = ? where test_id = ? and problem_id = ? and explanation = ?",
        result.pattern(),
        result.steps(),
        result.complexity(),
        result.edgeCases(),
        result.total(),
        result.feedback(),
        testId,
        problemId,
        gradedText);
  }

  private Optional<StoredTest> one(String where, Object... args) {
    List<StoredTest> found =
        jdbc.query(
            "select id, user_id, level, problem_ids, started_at, ends_at, submitted_at, score"
                + " from test_attempt "
                + where,
            (rs, row) -> {
              Timestamp submitted = rs.getTimestamp("submitted_at");
              return new StoredTest(
                  rs.getObject("id", UUID.class),
                  rs.getObject("user_id", UUID.class),
                  rs.getInt("level"),
                  Arrays.asList(rs.getString("problem_ids").split(",")),
                  rs.getTimestamp("started_at").toInstant(),
                  rs.getTimestamp("ends_at").toInstant(),
                  submitted == null ? null : submitted.toInstant(),
                  (Integer) rs.getObject("score"));
            },
            args);
    return found.stream().findFirst();
  }
}
