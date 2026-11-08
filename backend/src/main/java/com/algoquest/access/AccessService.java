package com.algoquest.access;

import com.algoquest.access.persistence.AppUser;
import com.algoquest.access.persistence.AppUserRepository;
import com.algoquest.access.persistence.RoleAssignment;
import com.algoquest.access.persistence.RoleAssignmentRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Users, role assignments, and permission checks (FR-17, D-034). */
@Service
public class AccessService {

  private final AppUserRepository users;
  private final RoleAssignmentRepository assignments;
  private final AuditLog auditLog;
  private final String ownerEmail;

  public AccessService(
      AppUserRepository users,
      RoleAssignmentRepository assignments,
      AuditLog auditLog,
      @Value("${algoquest.owner-email:}") String ownerEmail) {
    this.users = users;
    this.assignments = assignments;
    this.auditLog = auditLog;
    this.ownerEmail = normalizeEmail(ownerEmail);
  }

  /**
   * Finds or creates the user for a sign-in. New users get the Player role. The user whose email
   * matches {@code OWNER_EMAIL} also gets the Owner role, recorded as a system action.
   */
  @Transactional
  public UUID signIn(SignInProfile profile) {
    String email = normalizeEmail(profile.email());
    AppUser user =
        users
            .findByProviderAndProviderSubject(profile.provider(), profile.providerSubject())
            .or(() -> users.findByEmail(email))
            .orElseGet(() -> createPlayer(profile, email));
    if (profile.displayName() != null && !profile.displayName().isBlank()) {
      user.setDisplayName(profile.displayName());
    }
    if (!ownerEmail.isEmpty() && ownerEmail.equals(user.getEmail())) {
      ensureRole(null, user.getId(), Role.OWNER, Scope.GLOBAL, "configured owner email");
    }
    users.flush(); // other modules may reference the user through plain SQL in this transaction
    return user.getId();
  }

  @Transactional(readOnly = true)
  public Set<Permission> permissionsOf(UUID userId, Scope scope) {
    Set<Permission> result = EnumSet.noneOf(Permission.class);
    for (RoleAssignment assignment : assignments.findByUserId(userId)) {
      if (assignment.appliesTo(scope)) {
        result.addAll(assignment.getRole().permissions());
      }
    }
    return result;
  }

  public boolean hasPermission(UUID userId, Scope scope, Permission permission) {
    return permissionsOf(userId, scope).contains(permission);
  }

  /**
   * Grants a role. The actor needs {@code admin.roles.grant} in the scope and must hold every
   * permission of the role being granted. Granting a role the user already has changes nothing.
   */
  @Transactional
  public void grantRole(UUID actorId, UUID targetUserId, Role role, Scope scope) {
    requireCanManage(actorId, role, scope);
    requireUser(targetUserId);
    ensureRole(actorId, targetUserId, role, scope, null);
  }

  /**
   * Removes a role, with the same rules as {@link #grantRole}. The last global Owner can never be
   * removed (FR-17.3).
   */
  @Transactional
  public void removeRole(UUID actorId, UUID targetUserId, Role role, Scope scope) {
    requireCanManage(actorId, role, scope);
    requireUser(targetUserId);
    boolean globalOwner = role == Role.OWNER && scope.isGlobal();
    List<RoleAssignment> held;
    if (globalOwner) {
      held = assignments.lockGlobalByRole(Role.OWNER);
    } else {
      held = assignments.findByUserId(targetUserId);
    }
    RoleAssignment toRemove = null;
    for (RoleAssignment a : held) {
      if (a.getUserId().equals(targetUserId) && a.getRole() == role && a.getScope().equals(scope)) {
        toRemove = a;
      }
    }
    if (toRemove == null) {
      return;
    }
    if (globalOwner && held.size() <= 1) {
      throw new LastOwnerException();
    }
    assignments.delete(toRemove);
    auditLog.record(actorId, "role.remove", "user:" + targetUserId, roleValues(role, scope), null);
  }

  @Transactional(readOnly = true)
  public Optional<UserSummary> findUser(UUID userId) {
    return users.findById(userId).map(user -> summarize(user, assignments.findByUserId(userId)));
  }

  @Transactional(readOnly = true)
  public List<UserSummary> listUsers() {
    List<AppUser> all = users.findAllByOrderByCreatedAtAsc();
    List<UUID> ids = all.stream().map(AppUser::getId).toList();
    Map<UUID, List<RoleAssignment>> byUser = new HashMap<>();
    for (RoleAssignment a : assignments.findByUserIdIn(ids)) {
      byUser.computeIfAbsent(a.getUserId(), id -> new ArrayList<>()).add(a);
    }
    List<UserSummary> result = new ArrayList<>();
    for (AppUser u : all) {
      result.add(summarize(u, byUser.getOrDefault(u.getId(), List.of())));
    }
    return result;
  }

  private static UserSummary summarize(AppUser user, List<RoleAssignment> userAssignments) {
    List<Role> roles = new ArrayList<>();
    for (RoleAssignment a : userAssignments) {
      if (a.getScope().isGlobal()) {
        roles.add(a.getRole());
      }
    }
    Collections.sort(roles);
    return new UserSummary(
        user.getId(), user.getEmail(), user.getDisplayName(), roles, user.getCreatedAt());
  }

  private AppUser createPlayer(SignInProfile profile, String email) {
    AppUser user =
        new AppUser(
            UUID.randomUUID(),
            email,
            profile.displayName() == null ? email : profile.displayName(),
            profile.provider(),
            profile.providerSubject(),
            Instant.now());
    users.save(user);
    assignments.save(
        new RoleAssignment(
            UUID.randomUUID(), user.getId(), Role.PLAYER, Scope.GLOBAL, null, Instant.now()));
    return user;
  }

  private void ensureRole(UUID actorId, UUID userId, Role role, Scope scope, String reason) {
    for (RoleAssignment a : assignments.findByUserId(userId)) {
      if (a.getRole() == role && a.getScope().equals(scope)) {
        return;
      }
    }
    assignments.save(
        new RoleAssignment(UUID.randomUUID(), userId, role, scope, actorId, Instant.now()));
    Map<String, String> after = new TreeMap<>(roleValues(role, scope));
    if (reason != null) {
      after.put("reason", reason);
    }
    auditLog.record(actorId, "role.grant", "user:" + userId, null, after);
  }

  private void requireCanManage(UUID actorId, Role role, Scope scope) {
    Set<Permission> actorPermissions = permissionsOf(actorId, scope);
    if (!actorPermissions.contains(Permission.ADMIN_ROLES_GRANT)) {
      throw new AccessDeniedRuleException("You cannot change roles.");
    }
    if (!actorPermissions.containsAll(role.permissions())) {
      throw new AccessDeniedRuleException("You cannot manage a role with more access than yours.");
    }
  }

  private void requireUser(UUID userId) {
    if (!users.existsById(userId)) {
      throw new UserNotFoundException();
    }
  }

  private static Map<String, String> roleValues(Role role, Scope scope) {
    return scope.isGlobal()
        ? Map.of("role", role.name(), "scope", "global")
        : Map.of("role", role.name(), "scope", scope.type() + ":" + scope.id());
  }

  private static String normalizeEmail(String email) {
    return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
  }
}
