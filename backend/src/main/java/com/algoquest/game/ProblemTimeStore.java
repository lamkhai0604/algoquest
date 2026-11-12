package com.algoquest.game;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Active working time per player and problem: the clock of the time bonus (D-043). The solve page
 * sends a heartbeat every 30 seconds while it is visible. The time between two heartbeats counts
 * when they are at most {@link #MAX_GAP} apart; a longer gap means the page was closed or hidden,
 * and that time does not count.
 */
@Repository
public class ProblemTimeStore {

  /** The largest gap between heartbeats that still counts as working time. */
  public static final Duration MAX_GAP = Duration.ofSeconds(45);

  private final JdbcTemplate jdbc;
  private final Clock clock;

  public ProblemTimeStore(JdbcTemplate jdbc, Clock clock) {
    this.jdbc = jdbc;
    this.clock = clock;
  }

  /** Adds the time since the last heartbeat (when close enough) and returns the active seconds. */
  public int beat(UUID userId, String problemId) {
    Instant now = clock.instant();
    ensureRow(userId, problemId, now);
    Row row = lockRow(userId, problemId);
    int seconds = row.activeSeconds() + countable(row.lastBeatAt(), now);
    jdbc.update(
        "update problem_start set active_seconds = ?, last_beat_at = ?"
            + " where user_id = ? and problem_id = ?",
        seconds,
        Timestamp.from(now),
        userId,
        problemId);
    return seconds;
  }

  /** Active seconds so far, including the open stretch since the last heartbeat. */
  public int activeSeconds(UUID userId, String problemId) {
    List<Row> rows =
        jdbc.query(
            "select active_seconds, last_beat_at from problem_start"
                + " where user_id = ? and problem_id = ?",
            (rs, n) -> new Row(rs.getInt("active_seconds"), instant(rs.getTimestamp("last_beat_at"))),
            userId,
            problemId);
    if (rows.isEmpty()) {
      return 0;
    }
    Row row = rows.get(0);
    return row.activeSeconds() + countable(row.lastBeatAt(), clock.instant());
  }

  /** Starts the clock again from zero (Start again or Retry). */
  public void restart(UUID userId, String problemId) {
    Instant now = clock.instant();
    ensureRow(userId, problemId, now);
    jdbc.update(
        "update problem_start set active_seconds = 0, last_beat_at = null"
            + " where user_id = ? and problem_id = ?",
        userId,
        problemId);
  }

  /** Problems the player has spent working time on. */
  public Set<String> started(UUID userId) {
    return new HashSet<>(
        jdbc.queryForList(
            "select problem_id from problem_start where user_id = ? and active_seconds > 0",
            String.class,
            userId));
  }

  private void ensureRow(UUID userId, String problemId, Instant now) {
    jdbc.update(
        "insert into problem_start (user_id, problem_id, started_at) values (?, ?, ?)"
            + " on conflict do nothing",
        userId,
        problemId,
        Timestamp.from(now));
  }

  private Row lockRow(UUID userId, String problemId) {
    return jdbc.queryForObject(
        "select active_seconds, last_beat_at from problem_start"
            + " where user_id = ? and problem_id = ? for update",
        (rs, n) -> new Row(rs.getInt("active_seconds"), instant(rs.getTimestamp("last_beat_at"))),
        userId,
        problemId);
  }

  private static int countable(Instant lastBeatAt, Instant now) {
    if (lastBeatAt == null) {
      return 0;
    }
    Duration gap = Duration.between(lastBeatAt, now);
    if (gap.isNegative() || gap.compareTo(MAX_GAP) > 0) {
      return 0;
    }
    return (int) gap.toSeconds();
  }

  private static Instant instant(Timestamp timestamp) {
    return timestamp == null ? null : timestamp.toInstant();
  }

  private record Row(int activeSeconds, Instant lastBeatAt) {}
}
