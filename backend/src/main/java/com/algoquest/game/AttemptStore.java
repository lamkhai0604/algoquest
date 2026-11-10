package com.algoquest.game;

import com.algoquest.grading.GradingResult;
import java.sql.Timestamp;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Stores graded attempts (FR-05.6). */
@Repository
public class AttemptStore {

  /** A stored attempt: who made it, for which problem, and what it earned. */
  public record StoredAttempt(
      UUID id, UUID userId, String problemId, String mode, GradingResult result, int xpGained) {}

  private final JdbcTemplate jdbc;
  private final Clock clock;

  public AttemptStore(JdbcTemplate jdbc, Clock clock) {
    this.jdbc = jdbc;
    this.clock = clock;
  }

  public Optional<StoredAttempt> find(UUID attemptId) {
    List<StoredAttempt> found =
        jdbc.query(
            "select id, user_id, problem_id, mode, pattern, steps, complexity, edge_cases,"
                + " feedback, xp_gained from attempt where id = ?",
            (rs, row) ->
                new StoredAttempt(
                    rs.getObject("id", UUID.class),
                    rs.getObject("user_id", UUID.class),
                    rs.getString("problem_id"),
                    rs.getString("mode"),
                    new GradingResult(
                        rs.getInt("pattern"),
                        rs.getInt("steps"),
                        rs.getInt("complexity"),
                        rs.getInt("edge_cases"),
                        rs.getString("feedback")),
                    rs.getInt("xp_gained")),
            attemptId);
    return found.stream().findFirst();
  }

  /** Saves the attempt. Returns false when an attempt with this ID already exists. */
  public boolean insert(
      StoredAttempt attempt,
      String mode,
      String explanation,
      int hintsUsed,
      int secondsTaken,
      String grader,
      long gradingMs) {
    GradingResult result = attempt.result();
    int rows =
        jdbc.update(
            "insert into attempt (id, user_id, problem_id, mode, explanation, pattern, steps,"
                + " complexity, edge_cases, total, feedback, hints_used, seconds_taken, xp_gained,"
                + " grader, grading_ms, created_at)"
                + " values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                + " on conflict (id) do nothing",
            attempt.id(),
            attempt.userId(),
            attempt.problemId(),
            mode,
            explanation,
            result.pattern(),
            result.steps(),
            result.complexity(),
            result.edgeCases(),
            result.total(),
            result.feedback(),
            hintsUsed,
            secondsTaken,
            attempt.xpGained(),
            grader,
            (int) Math.min(gradingMs, Integer.MAX_VALUE),
            Timestamp.from(clock.instant()));
    return rows == 1;
  }
}
