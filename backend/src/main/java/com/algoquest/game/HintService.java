package com.algoquest.game;

import com.algoquest.content.model.Problem;
import com.algoquest.game.domain.GameRules;
import com.algoquest.game.domain.HintRules;
import com.algoquest.shared.web.ApiException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hints (FR-06). A hint's text is sent only after the player opens it, and opening it is recorded
 * first. Opened hints stay readable without using the quota again.
 */
@Service
public class HintService {

  /** The hint quota as the player sees it. {@code refillsAt} is null when no hint is in use. */
  public record Quota(int remaining, int perWindow, Instant refillsAt) {}

  /** The hints a player has opened for one problem, and the quota. */
  public record Hints(List<String> opened, int total, Quota quota) {}

  private final GameService game;
  private final JdbcTemplate jdbc;
  private final Clock clock;
  private final GameRulesService rules;

  public HintService(GameService game, JdbcTemplate jdbc, Clock clock, GameRulesService rules) {
    this.game = game;
    this.jdbc = jdbc;
    this.clock = clock;
    this.rules = rules;
  }

  @Transactional(readOnly = true)
  public Quota quota(UUID userId) {
    return quota(userId, clock.instant());
  }

  @Transactional(readOnly = true)
  public Hints opened(UUID userId, String problemId) {
    Problem problem = game.playableProblem(userId, problemId);
    return hints(userId, problem, clock.instant());
  }

  /** Opens the next hint of a problem, if the player has quota left. */
  @Transactional
  public Hints openNext(UUID userId, String problemId) {
    Problem problem = game.playableProblem(userId, problemId);
    // One player's hint requests run one at a time, so two at once cannot both pass the quota.
    jdbc.queryForObject("select id from app_user where id = ? for update", UUID.class, userId);
    Instant now = clock.instant();
    int used = usedFor(userId, problem.id());
    if (used >= problem.hints().size()) {
      throw new ApiException(HttpStatus.CONFLICT, "No more hints", "All hints are open.");
    }
    Quota quota = quota(userId, now);
    if (quota.remaining() == 0) {
      throw new ApiException(
          HttpStatus.TOO_MANY_REQUESTS,
          "No hints left",
          "You have used your 3 hints. Each one comes back 5 hours after it was opened.");
    }
    jdbc.update(
        "insert into hint_use (id, user_id, problem_id, hint_number, used_at)"
            + " values (?, ?, ?, ?, ?)",
        UUID.randomUUID(),
        userId,
        problem.id(),
        used + 1,
        Timestamp.from(now));
    return hints(userId, problem, now);
  }

  /** How many hints the player has opened for a problem; each one lowers its XP by 20%. */
  public int usedFor(UUID userId, String problemId) {
    Integer count =
        jdbc.queryForObject(
            "select count(*) from hint_use where user_id = ? and problem_id = ?",
            Integer.class,
            userId,
            problemId);
    return count == null ? 0 : count;
  }

  private Hints hints(UUID userId, Problem problem, Instant now) {
    int used = usedFor(userId, problem.id());
    return new Hints(problem.hints().subList(0, used), problem.hints().size(), quota(userId, now));
  }

  private Quota quota(UUID userId, Instant now) {
    GameRules current = rules.current();
    List<Timestamp> rows =
        jdbc.queryForList(
            "select used_at from hint_use where user_id = ? and used_at > ?",
            Timestamp.class,
            userId,
            Timestamp.from(now.minus(current.hintWindow())));
    List<Instant> openedAt = rows.stream().map(Timestamp::toInstant).toList();
    return new Quota(
        HintRules.remaining(current, openedAt, now),
        current.hintsPerWindow(),
        HintRules.nextRefill(current, openedAt, now).orElse(null));
  }
}
