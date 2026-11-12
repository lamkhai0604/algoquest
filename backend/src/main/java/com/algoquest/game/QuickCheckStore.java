package com.algoquest.game;

import java.sql.Timestamp;
import java.time.Clock;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Finished quick checks: one row per player and level (D-041). */
@Repository
public class QuickCheckStore {

  private final JdbcTemplate jdbc;
  private final Clock clock;

  public QuickCheckStore(JdbcTemplate jdbc, Clock clock) {
    this.jdbc = jdbc;
    this.clock = clock;
  }

  /** Records a finished quick check. Returns false when it was already recorded. */
  public boolean complete(UUID userId, int level, int xp) {
    return jdbc.update(
            "insert into quick_check (user_id, level, xp, completed_at) values (?, ?, ?, ?)"
                + " on conflict do nothing",
            userId,
            level,
            xp,
            Timestamp.from(clock.instant()))
        == 1;
  }

  public boolean done(UUID userId, int level) {
    Integer count =
        jdbc.queryForObject(
            "select count(*) from quick_check where user_id = ? and level = ?",
            Integer.class,
            userId,
            level);
    return count != null && count > 0;
  }
}
