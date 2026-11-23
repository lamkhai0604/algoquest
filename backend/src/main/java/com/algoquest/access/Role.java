package com.algoquest.access;

import java.util.EnumSet;
import java.util.Set;

/** Roles are bundles of permissions (FR-17). */
public enum Role {
  OWNER(EnumSet.allOf(Permission.class)),
  PLAYER(EnumSet.of(Permission.GAME_PLAY)),
  /** A visitor's demo account: plays every available level (D-062). */
  DEMO(EnumSet.of(Permission.GAME_PLAY, Permission.GAME_ALL_LEVELS)),
  /** The shared guest account (D-075): learns and keeps its own notes, nothing else. */
  GUEST(EnumSet.of(Permission.GAME_PLAY, Permission.NOTES_MANAGE)),
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
