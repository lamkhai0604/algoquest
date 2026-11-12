package com.algoquest.admin;

import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin: the audit log, newest first (FR-17.6). Read only; entries are never changed. */
@RestController
public class AdminAuditController {

  private final JdbcTemplate jdbc;

  public AdminAuditController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  /**
   * One audit entry.
   *
   * @param targetEmail the user the action was about, when the target is a user
   */
  public record AuditEntry(
      Instant at,
      String actorEmail,
      String action,
      String target,
      String targetEmail,
      String before,
      String after) {}

  @GetMapping("/api/v1/admin/audit-log")
  @PreAuthorize("hasPermission(null, 'admin.auditLog.view')")
  public List<AuditEntry> list(@RequestParam(defaultValue = "100") int limit) {
    return jdbc.query(
        "select a.at, actor.email as actor_email, a.action, a.target, target.email as target_email,"
            + " a.before_value, a.after_value from audit_log a"
            + " left join app_user actor on actor.id = a.actor_id"
            + " left join app_user target on 'user:' || target.id::text = a.target"
            + " order by a.at desc limit ?",
        (rs, row) ->
            new AuditEntry(
                rs.getTimestamp("at").toInstant(),
                rs.getString("actor_email"),
                rs.getString("action"),
                rs.getString("target"),
                rs.getString("target_email"),
                rs.getString("before_value"),
                rs.getString("after_value")),
        Math.max(1, Math.min(limit, 500)));
  }
}
