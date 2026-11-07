package com.algoquest.admin;

import com.algoquest.access.AccessService;
import com.algoquest.access.UserSummary;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
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
}
