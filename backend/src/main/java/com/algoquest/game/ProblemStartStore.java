package com.algoquest.game;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** When a player first opened each problem: the start of the time bonus (FR-08). */
@Repository
public class ProblemStartStore {

  private final JdbcTemplate jdbc;
  private final Clock clock;

  public ProblemStartStore(JdbcTemplate jdbc, Clock clock) {
    this.jdbc = jdbc;
    this.clock = clock;
  }

  /** Records the first opening (later ones change nothing) and returns its time. */
  public Instant openedAt(UUID userId, String problemId) {
    jdbc.update(
        "insert into problem_start (user_id, problem_id, started_at) values (?, ?, ?)"
            + " on conflict do nothing",
        userId,
        problemId,
        Timestamp.from(clock.instant()));
    return jdbc.queryForObject(
            "select started_at from problem_start where user_id = ? and problem_id = ?",
            Timestamp.class,
            userId,
            problemId)
        .toInstant();
  }
}
