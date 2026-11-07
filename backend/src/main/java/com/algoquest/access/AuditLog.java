package com.algoquest.access;

import com.algoquest.access.persistence.AuditLogEntry;
import com.algoquest.access.persistence.AuditLogRepository;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Writes audit log entries (FR-17.6). Always part of the caller's transaction. */
@Service
public class AuditLog {

  private final AuditLogRepository entries;

  public AuditLog(AuditLogRepository entries) {
    this.entries = entries;
  }

  /**
   * Records an admin action. Must run inside the transaction that makes the change, so the change
   * and its audit entry are saved together or not at all.
   *
   * @param actorId the acting user, or {@code null} for a system action
   */
  @Transactional(propagation = Propagation.MANDATORY)
  public void record(
      UUID actorId,
      String action,
      String target,
      Map<String, String> before,
      Map<String, String> after) {
    String beforeJson = toJson(before);
    String afterJson = toJson(after);
    entries.save(
        new AuditLogEntry(
            UUID.randomUUID(), actorId, action, target, beforeJson, afterJson, Instant.now()));
  }

  static String toJson(Map<String, String> values) {
    if (values == null) {
      return null;
    }
    return values.entrySet().stream()
        .sorted(Map.Entry.comparingByKey())
        .map(e -> quote(e.getKey()) + ":" + quote(e.getValue()))
        .collect(Collectors.joining(",", "{", "}"));
  }

  private static String quote(String value) {
    if (value == null) {
      return "null";
    }
    StringBuilder out = new StringBuilder("\"");
    for (char c : value.toCharArray()) {
      switch (c) {
        case '"' -> out.append("\\\"");
        case '\\' -> out.append("\\\\");
        case '\n' -> out.append("\\n");
        case '\r' -> out.append("\\r");
        case '\t' -> out.append("\\t");
        default -> {
          if (c < 0x20) {
            out.append(String.format("\\u%04x", (int) c));
          } else {
            out.append(c);
          }
        }
      }
    }
    return out.append('"').toString();
  }
}
