package com.algoquest.access;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.algoquest.access.persistence.AuditLogEntry;
import com.algoquest.access.persistence.AuditLogRepository;
import com.algoquest.access.persistence.RoleAssignment;
import com.algoquest.access.persistence.RoleAssignmentRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "algoquest.owner-email=Owner@Example.com")
@ActiveProfiles("test")
@Transactional
class AccessServiceIntegrationTest {

  @Autowired private AccessService access;
  @Autowired private RoleAssignmentRepository assignments;
  @Autowired private AuditLogRepository auditLog;
  @Autowired private JdbcTemplate jdbc;

  private UUID signIn(String email) {
    return access.signIn(new SignInProfile("github", "id-" + email, email, "Name " + email));
  }

  private List<AuditLogEntry> entriesFor(UUID userId) {
    return auditLog.findAllByOrderByAtDesc().stream()
        .filter(e -> e.getTarget().equals("user:" + userId))
        .toList();
  }

  @Test
  void newUserIsAPlayer() {
    UUID player = signIn("player@example.com");

    assertThat(access.permissionsOf(player, Scope.GLOBAL)).containsExactly(Permission.GAME_PLAY);
  }

  @Test
  void configuredOwnerEmailBecomesOwnerWithAnAuditEntry() {
    UUID owner = signIn("owner@example.com");

    assertThat(access.hasPermission(owner, Scope.GLOBAL, Permission.ADMIN_ROLES_GRANT)).isTrue();
    List<AuditLogEntry> entries = entriesFor(owner);
    assertThat(entries).hasSize(1);
    assertThat(entries.get(0).getActorId()).isNull();
    assertThat(entries.get(0).getAction()).isEqualTo("role.grant");
    assertThat(entries.get(0).getAfterValue()).contains("OWNER").contains("configured owner email");
  }

  @Test
  void signingInAgainReusesTheUser() {
    UUID first = signIn("player@example.com");
    UUID second = signIn("player@example.com");

    assertThat(second).isEqualTo(first);
    assertThat(assignments.findByUserId(first)).hasSize(1);
  }

  @Test
  void playerCannotChangeRoles() {
    UUID player = signIn("player@example.com");
    UUID other = signIn("other@example.com");

    assertThatThrownBy(() -> access.grantRole(player, other, Role.PLAYER, Scope.GLOBAL))
        .isInstanceOf(AccessDeniedRuleException.class);
  }

  @Test
  void ownerGrantsAndRemovesARoleWithAuditEntries() {
    UUID owner = signIn("owner@example.com");
    UUID player = signIn("player@example.com");

    access.grantRole(owner, player, Role.OWNER, Scope.GLOBAL);
    assertThat(access.hasPermission(player, Scope.GLOBAL, Permission.ADMIN_USERS_VIEW)).isTrue();

    access.removeRole(owner, player, Role.OWNER, Scope.GLOBAL);
    assertThat(access.hasPermission(player, Scope.GLOBAL, Permission.ADMIN_USERS_VIEW)).isFalse();

    assertThat(entriesFor(player))
        .extracting(AuditLogEntry::getAction)
        .containsExactlyInAnyOrder("role.grant", "role.remove");
    assertThat(entriesFor(player)).allMatch(e -> owner.equals(e.getActorId()));
  }

  @Test
  void theLastOwnerCannotBeRemoved() {
    UUID owner = signIn("owner@example.com");

    assertThatThrownBy(() -> access.removeRole(owner, owner, Role.OWNER, Scope.GLOBAL))
        .isInstanceOf(LastOwnerException.class);
    assertThat(access.hasPermission(owner, Scope.GLOBAL, Permission.ADMIN_ROLES_GRANT)).isTrue();
  }

  @Test
  void anOwnerCanBeRemovedWhileAnotherRemains() {
    UUID owner = signIn("owner@example.com");
    UUID second = signIn("second@example.com");
    access.grantRole(owner, second, Role.OWNER, Scope.GLOBAL);

    access.removeRole(second, owner, Role.OWNER, Scope.GLOBAL);

    assertThat(access.hasPermission(owner, Scope.GLOBAL, Permission.ADMIN_ROLES_GRANT)).isFalse();
  }

  @Test
  void scopedRoleAppliesOnlyInItsScope() {
    UUID player = signIn("player@example.com");
    Scope org = Scope.of("organization", UUID.randomUUID());
    assignments.save(
        new RoleAssignment(UUID.randomUUID(), player, Role.OWNER, org, null, Instant.now()));

    assertThat(access.hasPermission(player, org, Permission.ADMIN_USERS_VIEW)).isTrue();
    assertThat(access.hasPermission(player, Scope.GLOBAL, Permission.ADMIN_USERS_VIEW)).isFalse();
    Scope otherOrg = Scope.of("organization", UUID.randomUUID());
    assertThat(access.hasPermission(player, otherOrg, Permission.ADMIN_USERS_VIEW)).isFalse();
    assertThat(access.hasPermission(player, otherOrg, Permission.GAME_PLAY)).isTrue();
  }

  @Test
  void theAuditLogIsAppendOnly() {
    signIn("owner@example.com");
    auditLog.flush();

    assertThatThrownBy(() -> jdbc.update("update audit_log set action = 'edited'"))
        .isInstanceOf(DataAccessException.class);
  }
}
