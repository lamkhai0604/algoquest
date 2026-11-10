package com.algoquest.game;

import com.algoquest.game.domain.ProblemProgress;
import java.sql.Timestamp;
import java.time.Clock;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Reads and writes problem progress. Every query is filtered by the user (NFR-02). */
@Repository
public class ProgressStore {

  private final JdbcTemplate jdbc;
  private final Clock clock;

  public ProgressStore(JdbcTemplate jdbc, Clock clock) {
    this.jdbc = jdbc;
    this.clock = clock;
  }

  /** The user's progress on every problem they have solved, keyed by problem ID. */
  public Map<String, ProblemProgress> byProblem(UUID userId) {
    Map<String, ProblemProgress> result = new HashMap<>();
    jdbc.query(
        "select problem_id, solved, xp_awarded, code_bonus from problem_progress where user_id = ?",
        rs -> {
          result.put(
              rs.getString("problem_id"),
              new ProblemProgress(
                  rs.getBoolean("solved"), rs.getInt("xp_awarded"), rs.getBoolean("code_bonus")));
        },
        userId);
    return result;
  }

  /** XP per level: the sum of the XP awarded for that level's problems. */
  public Map<Integer, Integer> xpByLevel(UUID userId) {
    Map<Integer, Integer> result = new HashMap<>();
    jdbc.query(
        "select level, sum(xp_awarded + practice_xp) as xp from problem_progress"
            + " where user_id = ? group by level",
        rs -> {
          result.put(rs.getInt("level"), rs.getInt("xp"));
        },
        userId);
    return result;
  }

  /**
   * The user's progress on one problem, locking the row until the transaction ends so two
   * submissions cannot both award XP.
   */
  public ProblemProgress lock(UUID userId, String problemId, int level) {
    jdbc.update(
        "insert into problem_progress (user_id, problem_id, level, solved, xp_awarded, updated_at)"
            + " values (?, ?, ?, false, 0, ?) on conflict do nothing",
        userId,
        problemId,
        level,
        Timestamp.from(clock.instant()));
    return jdbc.queryForObject(
        "select solved, xp_awarded, code_bonus from problem_progress"
            + " where user_id = ? and problem_id = ? for update",
        (rs, row) ->
            new ProblemProgress(
                rs.getBoolean("solved"), rs.getInt("xp_awarded"), rs.getBoolean("code_bonus")),
        userId,
        problemId);
  }

  /** IDs of the problems the player has marked Done in a practice round. */
  public Set<String> practiceDone(UUID userId) {
    return new HashSet<>(
        jdbc.queryForList(
            "select problem_id from problem_progress where user_id = ? and practice_done",
            String.class,
            userId));
  }

  /** Marks a problem Done in the practice round with the XP it earned. */
  public void markPracticeDone(UUID userId, String problemId, int xp) {
    jdbc.update(
        "update problem_progress set practice_done = true, practice_xp = ?, updated_at = ?"
            + " where user_id = ? and problem_id = ?",
        xp,
        Timestamp.from(clock.instant()),
        userId,
        problemId);
  }

  public void save(UUID userId, String problemId, ProblemProgress progress) {
    jdbc.update(
        "update problem_progress set solved = ?, xp_awarded = ?, code_bonus = ?, updated_at = ?"
            + " where user_id = ? and problem_id = ?",
        progress.solved(),
        progress.xpAwarded(),
        progress.codeBonusAwarded(),
        Timestamp.from(clock.instant()),
        userId,
        problemId);
  }
}
