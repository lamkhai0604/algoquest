package com.algoquest.access.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** One audit log row. Rows are never updated or deleted (enforced by a database trigger). */
@Entity
@Table(name = "audit_log")
public class AuditLogEntry {

  @Id private UUID id;

  @Column(name = "actor_id")
  private UUID actorId;

  @Column(nullable = false)
  private String action;

  @Column(nullable = false)
  private String target;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "before_value")
  private String beforeValue;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "after_value")
  private String afterValue;

  @Column(nullable = false)
  private Instant at;

  protected AuditLogEntry() {}

  public AuditLogEntry(
      UUID id,
      UUID actorId,
      String action,
      String target,
      String beforeValue,
      String afterValue,
      Instant at) {
    this.id = id;
    this.actorId = actorId;
    this.action = action;
    this.target = target;
    this.beforeValue = beforeValue;
    this.afterValue = afterValue;
    this.at = at;
  }

  public UUID getId() {
    return id;
  }

  public UUID getActorId() {
    return actorId;
  }

  public String getAction() {
    return action;
  }

  public String getTarget() {
    return target;
  }

  public String getBeforeValue() {
    return beforeValue;
  }

  public String getAfterValue() {
    return afterValue;
  }

  public Instant getAt() {
    return at;
  }
}
