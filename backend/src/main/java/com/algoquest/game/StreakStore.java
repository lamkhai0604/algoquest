package com.algoquest.game;

import com.algoquest.game.domain.StreakRules.Streak;
import java.sql.Date;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class StreakStore {

  private final JdbcTemplate jdbc;

  public StreakStore(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public Streak find(UUID userId) {
    List<Streak> found =
        jdbc.query(
            "select current, best, last_active_day from streak where user_id = ?",
            (rs, row) ->
                new Streak(
                    rs.getInt("current"),
                    rs.getInt("best"),
                    rs.getDate("last_active_day").toLocalDate()),
            userId);
    return found.isEmpty() ? Streak.NONE : found.get(0);
  }

  /** Reads the streak and locks it until the transaction ends. */
  public Streak lock(UUID userId) {
    List<Streak> found =
        jdbc.query(
            "select current, best, last_active_day from streak where user_id = ? for update",
            (rs, row) ->
                new Streak(
                    rs.getInt("current"),
                    rs.getInt("best"),
                    rs.getDate("last_active_day").toLocalDate()),
            userId);
    return found.isEmpty() ? Streak.NONE : found.get(0);
  }

  public void save(UUID userId, Streak streak) {
    jdbc.update(
        "insert into streak (user_id, current, best, last_active_day) values (?, ?, ?, ?)"
            + " on conflict (user_id) do update set current = excluded.current,"
            + " best = excluded.best, last_active_day = excluded.last_active_day",
        userId,
        streak.current(),
        streak.best(),
        Date.valueOf(streak.lastActiveDay()));
  }
}
