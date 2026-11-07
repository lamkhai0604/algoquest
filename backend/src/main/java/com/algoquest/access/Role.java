package com.algoquest.access;

import java.util.EnumSet;
import java.util.Set;

/** Roles are bundles of permissions (FR-17). */
public enum Role {
  OWNER(EnumSet.allOf(Permission.class)),
  PLAYER(EnumSet.of(Permission.GAME_PLAY)),
  /** Defined with no permissions until the PO decides its scope (OQ-05). */
  ADMIN(EnumSet.noneOf(Permission.class));

  private final Set<Permission> permissions;

  Role(Set<Permission> permissions) {
    this.permissions = Set.copyOf(permissions);
  }

  public Set<Permission> permissions() {
    return permissions;
  }
}
