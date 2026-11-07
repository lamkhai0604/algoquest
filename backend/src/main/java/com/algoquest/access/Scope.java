package com.algoquest.access;

import java.util.Objects;
import java.util.UUID;

/**
 * Where a role assignment applies. {@link #GLOBAL} covers everything; a typed scope (for example an
 * organization, FR-19) covers only that object. Global permissions apply in every scope.
 */
public record Scope(String type, UUID id) {

  public static final Scope GLOBAL = new Scope(null, null);

  public Scope {
    if ((type == null) != (id == null)) {
      throw new IllegalArgumentException("Scope type and id must both be set or both be empty");
    }
  }

  public static Scope of(String type, UUID id) {
    return new Scope(Objects.requireNonNull(type), Objects.requireNonNull(id));
  }

  public boolean isGlobal() {
    return type == null;
  }
}
