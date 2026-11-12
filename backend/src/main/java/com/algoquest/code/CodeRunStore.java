package com.algoquest.code;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Runs of a player's code against the hidden tests (T-401, T-402). */
@Repository
public class CodeRunStore {

  private final JdbcTemplate jdbc;

  public CodeRunStore(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public void save(
      UUID id,
      UUID userId,
      String problemId,
      String language,
      String code,
      int passed,
      int total,
      int xpGained,
      Instant at) {
    jdbc.update(
        "insert into code_run (id, user_id, problem_id, language, code, passed, total, xp_gained,"
            + " created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        id,
        userId,
        problemId,
        language,
        code,
        passed,
        total,
        xpGained,
        Timestamp.from(at));
  }

  /** Runs in one language since midnight UTC, which is when the Judge0 quota resets. */
  public int countToday(String language, Instant now) {
    Instant midnight = now.atOffset(ZoneOffset.UTC).truncatedTo(ChronoUnit.DAYS).toInstant();
    Integer count =
        jdbc.queryForObject(
            "select count(*) from code_run where language = ? and created_at >= ?",
            Integer.class,
            language,
            Timestamp.from(midnight));
    return count == null ? 0 : count;
  }
}
