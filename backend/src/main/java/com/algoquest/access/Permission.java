package com.algoquest.access;

import java.util.Arrays;
import java.util.Optional;

/** Named permissions (ARCHITECTURE §9.1). Code checks permissions, never role names. */
public enum Permission {
  GAME_PLAY("game.play"),
  /** Opens every available level, problem, practice round, and test, for testing content. */
  GAME_ALL_LEVELS("game.allLevels"),
  ADMIN_GRADING_LOG_VIEW("admin.gradingLog.view"),
  ADMIN_PROGRESS_RESET("admin.progress.reset"),
  ADMIN_CONFIG_EDIT("admin.config.edit"),
  ADMIN_USERS_VIEW("admin.users.view"),
  ADMIN_ROLES_GRANT("admin.roles.grant"),
  ADMIN_AUDIT_LOG_VIEW("admin.auditLog.view"),
  /** Writes and reads one's own notes (D-074). Only the Owner holds it. */
  NOTES_MANAGE("notes.manage");

  private final String code;

  Permission(String code) {
    this.code = code;
  }

  public String code() {
    return code;
  }

  public static Optional<Permission> fromCode(String code) {
    return Arrays.stream(values()).filter(p -> p.code.equals(code)).findFirst();
  }
}
