package com.algoquest.access.security;

import com.algoquest.access.AccessService;
import com.algoquest.access.AuthenticatedUser;
import com.algoquest.access.Permission;
import com.algoquest.access.Scope;
import java.io.Serializable;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;

/**
 * Backs {@code hasPermission(...)} in {@code @PreAuthorize} (D-034). With a null target it checks a
 * global permission; with a target ID and type it checks the permission in that scope. Unknown
 * permission codes and unauthenticated callers are always denied.
 */
public class AccessPermissionEvaluator implements PermissionEvaluator {

  private final AccessService access;

  public AccessPermissionEvaluator(AccessService access) {
    this.access = access;
  }

  @Override
  public boolean hasPermission(
      Authentication authentication, Object targetDomainObject, Object permission) {
    return check(authentication, Scope.GLOBAL, permission);
  }

  @Override
  public boolean hasPermission(
      Authentication authentication, Serializable targetId, String targetType, Object permission) {
    if (!(targetId instanceof UUID id) || targetType == null) {
      return false;
    }
    return check(authentication, Scope.of(targetType, id), permission);
  }

  private boolean check(Authentication authentication, Scope scope, Object permission) {
    Optional<UUID> userId = userId(authentication);
    Optional<Permission> wanted = Permission.fromCode(String.valueOf(permission));
    if (userId.isEmpty() || wanted.isEmpty()) {
      return false;
    }
    return access.hasPermission(userId.get(), scope, wanted.get());
  }

  private static Optional<UUID> userId(Authentication authentication) {
    if (authentication != null
        && authentication.isAuthenticated()
        && authentication.getPrincipal() instanceof AuthenticatedUser user) {
      return Optional.of(user.id());
    }
    return Optional.empty();
  }
}
