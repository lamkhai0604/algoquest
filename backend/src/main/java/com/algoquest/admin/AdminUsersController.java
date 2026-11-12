package com.algoquest.admin;

import com.algoquest.access.AccessService;
import com.algoquest.access.AuthenticatedUser;
import com.algoquest.access.Role;
import com.algoquest.access.Scope;
import com.algoquest.access.UserSummary;
import com.algoquest.shared.web.ApiException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin: users and their roles (FR-18.4). */
@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUsersController {

  private final AccessService access;

  public AdminUsersController(AccessService access) {
    this.access = access;
  }

  @GetMapping
  @PreAuthorize("hasPermission(null, 'admin.users.view')")
  public List<UserSummary> list() {
    return access.listUsers();
  }

  /** A global role to grant or remove. */
  public record RoleRequest(Role role) {}

  @PostMapping("/{id}/roles")
  @PreAuthorize("hasPermission(null, 'admin.roles.grant')")
  public List<UserSummary> grant(
      @AuthenticationPrincipal AuthenticatedUser admin,
      @PathVariable UUID id,
      @RequestBody RoleRequest request) {
    return change(() -> access.grantRole(admin.id(), id, role(request), Scope.GLOBAL));
  }

  @DeleteMapping("/{id}/roles/{role}")
  @PreAuthorize("hasPermission(null, 'admin.roles.grant')")
  public List<UserSummary> remove(
      @AuthenticationPrincipal AuthenticatedUser admin,
      @PathVariable UUID id,
      @PathVariable Role role) {
    return change(() -> access.removeRole(admin.id(), id, role, Scope.GLOBAL));
  }

  private static Role role(RoleRequest request) {
    if (request == null || request.role() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role", "Choose a role.");
    }
    return request.role();
  }

  /** Runs a role change; its rule errors (last Owner, missing permission) are API errors. */
  private List<UserSummary> change(Runnable action) {
    action.run();
    return access.listUsers();
  }
}
