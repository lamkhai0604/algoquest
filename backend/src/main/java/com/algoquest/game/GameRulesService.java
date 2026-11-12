package com.algoquest.game;

import com.algoquest.access.AuditLog;
import com.algoquest.game.domain.GameRules;
import com.algoquest.shared.web.ApiException;
import java.sql.Timestamp;
import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * The game rules in force (D-047). Read from the database on each use, so a change applies on the
 * next request; fields missing from the stored record take their default values.
 */
@Service
public class GameRulesService {

  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final TypeReference<Map<String, Object>> MAP = new TypeReference<>() {};

  private final JdbcTemplate jdbc;
  private final AuditLog auditLog;
  private final Clock clock;

  public GameRulesService(JdbcTemplate jdbc, AuditLog auditLog, Clock clock) {
    this.jdbc = jdbc;
    this.auditLog = auditLog;
    this.clock = clock;
  }

  public GameRules current() {
    List<String> stored =
        jdbc.queryForList("select rules::text from game_config where id = 1", String.class);
    if (stored.isEmpty()) {
      return GameRules.DEFAULTS;
    }
    Map<String, Object> values = JSON.convertValue(GameRules.DEFAULTS, MAP);
    values.putAll(JSON.readValue(stored.get(0), MAP));
    return JSON.convertValue(values, GameRules.class);
  }

  /** Saves new rules and records the change in the audit log with before and after values. */
  @Transactional
  public GameRules update(UUID actorId, GameRules next) {
    if (next == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid rules", "Send every rule value.");
    }
    List<String> problems = next.problems();
    if (!problems.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid rules", String.join("; ", problems));
    }
    GameRules before = current();
    jdbc.update(
        "insert into game_config (id, rules, updated_at, updated_by) values (1, ?::jsonb, ?, ?)"
            + " on conflict (id) do update set rules = excluded.rules,"
            + " updated_at = excluded.updated_at, updated_by = excluded.updated_by",
        JSON.writeValueAsString(next),
        Timestamp.from(clock.instant()),
        actorId);
    auditLog.record(actorId, "config.update", "game-rules", changed(before, next), changed(next, before));
    return next;
  }

  /** Values of {@code rules} that differ from {@code other}, for the audit log. */
  private static Map<String, String> changed(GameRules rules, GameRules other) {
    Map<String, Object> mine = new TreeMap<>(JSON.convertValue(rules, MAP));
    Map<String, Object> theirs = JSON.convertValue(other, MAP);
    Map<String, String> result = new LinkedHashMap<>();
    mine.forEach(
        (key, value) -> {
          if (!value.equals(theirs.get(key))) {
            result.put(key, String.valueOf(value));
          }
        });
    return result;
  }
}
