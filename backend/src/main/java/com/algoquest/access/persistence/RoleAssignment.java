package com.algoquest.access.persistence;

import com.algoquest.access.Role;
import com.algoquest.access.Scope;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "role_assignment")
public class RoleAssignment {

  @Id private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @Column(name = "scope_type")
  private String scopeType;

  @Column(name = "scope_id")
  private UUID scopeId;

  @Column(name = "granted_by")
  private UUID grantedBy;

  @Column(name = "granted_at", nullable = false)
  private Instant grantedAt;

  protected RoleAssignment() {}

  public RoleAssignment(
      UUID id, UUID userId, Role role, Scope scope, UUID grantedBy, Instant grantedAt) {
    this.id = id;
    this.userId = userId;
    this.role = role;
    this.scopeType = scope.type();
    this.scopeId = scope.id();
    this.grantedBy = grantedBy;
    this.grantedAt = grantedAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public Role getRole() {
    return role;
  }

  public Scope getScope() {
    return new Scope(scopeType, scopeId);
  }

  /** True when this assignment applies in the given scope: global ones apply everywhere. */
  public boolean appliesTo(Scope scope) {
    return scopeType == null || getScope().equals(scope);
  }
}
