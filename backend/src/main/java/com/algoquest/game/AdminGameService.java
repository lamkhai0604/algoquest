package com.algoquest.game;

import com.algoquest.content.ContentCatalog;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.Problem;
import com.algoquest.shared.web.ApiException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Game data for the admin panel (FR-18.1, FR-18.2). Permission checks and the audit log are done by
 * the admin module; this class only reads and changes game data.
 */
@Service
public class AdminGameService {

  /** One graded attempt in the grading log. */
  public record LoggedAttempt(
      UUID id,
      String userEmail,
      String problemId,
      String mode,
      String explanation,
      int pattern,
      int steps,
      int complexity,
      int edgeCases,
      int total,
      String feedback,
      int hintsUsed,
      int secondsTaken,
      int xpGained,
      String grader,
      int gradingMs,
      Instant createdAt) {}

  /** A player's progress on one level, as reported before and after a reset. */
  public record LevelProgress(int level, int xp, int solved, Integer bestTestScore) {}

  public static final int MAX_LOG = 200;

  private final JdbcTemplate jdbc;
  private final ContentCatalog catalog;
  private final ProgressStore progress;
  private final TestStore tests;

  public AdminGameService(
      JdbcTemplate jdbc, ContentCatalog catalog, ProgressStore progress, TestStore tests) {
    this.jdbc = jdbc;
    this.catalog = catalog;
    this.progress = progress;
    this.tests = tests;
  }

  /** The newest graded attempts, optionally for one problem. */
  @Transactional(readOnly = true)
  public List<LoggedAttempt> gradingLog(String problemId, int limit) {
    int rows = Math.max(1, Math.min(limit, MAX_LOG));
    String filter = problemId == null || problemId.isBlank() ? "" : " where a.problem_id = ?";
    Object[] args = filter.isEmpty() ? new Object[] {rows} : new Object[] {problemId, rows};
    return jdbc.query(
        "select a.id, u.email, a.problem_id, a.mode, a.explanation, a.pattern, a.steps,"
            + " a.complexity, a.edge_cases, a.total, a.feedback, a.hints_used, a.seconds_taken,"
            + " a.xp_gained, a.grader, a.grading_ms, a.created_at"
            + " from attempt a join app_user u on u.id = a.user_id"
            + filter
            + " order by a.created_at desc limit ?",
        (rs, row) ->
            new LoggedAttempt(
                rs.getObject("id", UUID.class),
                rs.getString("email"),
                rs.getString("problem_id"),
                rs.getString("mode"),
                rs.getString("explanation"),
                rs.getInt("pattern"),
                rs.getInt("steps"),
                rs.getInt("complexity"),
                rs.getInt("edge_cases"),
                rs.getInt("total"),
                rs.getString("feedback"),
                rs.getInt("hints_used"),
                rs.getInt("seconds_taken"),
                rs.getInt("xp_gained"),
                rs.getString("grader"),
                rs.getInt("grading_ms"),
                rs.getTimestamp("created_at").toInstant()),
        args);
  }

  public LevelProgress levelProgress(UUID userId, int level) {
    int xp = progress.xpByLevel(userId).getOrDefault(level, 0);
    long solved =
        progress.byProblem(userId).entrySet().stream()
            .filter(e -> e.getValue().solved() && levelOf(e.getKey()) == level)
            .count();
    return new LevelProgress(level, xp, (int) solved, tests.bestScores(userId).get(level));
  }

  /**
   * Starts a level over for one player: problem progress, hint use, working time, the quick check,
   * and level-up tests of that level are removed. The grading log keeps the attempts. Must run inside the caller's
   * transaction, together with the audit entry.
   */
  @Transactional(propagation = Propagation.MANDATORY)
  public LevelProgress resetLevel(UUID userId, int level) {
    LevelContent content = catalog.level(level).orElse(null);
    if (content == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid level", "No such level.");
    }
    LevelProgress before = levelProgress(userId, level);
    String[] ids = content.problems().stream().map(Problem::id).toArray(String[]::new);
    jdbc.update("delete from problem_progress where user_id = ? and level = ?", userId, level);
    jdbc.update(
        "delete from hint_use where user_id = ? and problem_id = any (?)", userId, (Object) ids);
    jdbc.update(
        "delete from problem_start where user_id = ? and problem_id = any (?)",
        userId,
        (Object) ids);
    jdbc.update(
        "delete from test_answer where test_id in"
            + " (select id from test_attempt where user_id = ? and level = ?)",
        userId,
        level);
    jdbc.update("delete from test_attempt where user_id = ? and level = ?", userId, level);
    jdbc.update("delete from quick_check where user_id = ? and level = ?", userId, level);
    return before;
  }

  private int levelOf(String problemId) {
    return catalog.problem(problemId).map(Problem::level).orElse(-1);
  }

  /** Values for the audit log. */
  public static Map<String, String> auditValues(LevelProgress progress) {
    return Map.of(
        "level", String.valueOf(progress.level()),
        "xp", String.valueOf(progress.xp()),
        "solved", String.valueOf(progress.solved()),
        "bestTestScore", String.valueOf(progress.bestTestScore()));
  }
}
