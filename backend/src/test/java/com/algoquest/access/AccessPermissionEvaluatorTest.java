package com.algoquest.access;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.algoquest.access.security.AccessPermissionEvaluator;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;

class AccessPermissionEvaluatorTest {

  private final AccessService access = mock(AccessService.class);
  private final AccessPermissionEvaluator evaluator = new AccessPermissionEvaluator(access);
  private final UUID userId = UUID.randomUUID();
  private final Authentication signedIn =
      new UsernamePasswordAuthenticationToken(new AuthenticatedUser(userId), null, List.of());

  @Test
  void checksAGlobalPermission() {
    when(access.hasPermission(userId, Scope.GLOBAL, Permission.ADMIN_USERS_VIEW)).thenReturn(true);

    assertThat(evaluator.hasPermission(signedIn, null, "admin.users.view")).isTrue();
    assertThat(evaluator.hasPermission(signedIn, null, "admin.config.edit")).isFalse();
  }

  @Test
  void checksAPermissionInAScope() {
    UUID orgId = UUID.randomUUID();
    Scope org = Scope.of("organization", orgId);
    when(access.hasPermission(userId, org, Permission.GAME_PLAY)).thenReturn(true);

    assertThat(evaluator.hasPermission(signedIn, orgId, "organization", "game.play")).isTrue();
    assertThat(evaluator.hasPermission(signedIn, "not-a-uuid", "organization", "game.play"))
        .isFalse();
  }

  @Test
  void deniesUnknownPermissionCodes() {
    assertThat(evaluator.hasPermission(signedIn, null, "admin.everything")).isFalse();
    verifyNoInteractions(access);
  }

  @Test
  void deniesCallersWithoutAnAppUser() {
    Authentication anonymous =
        new AnonymousAuthenticationToken(
            "key", "anonymous", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS"));

    assertThat(evaluator.hasPermission(anonymous, null, "game.play")).isFalse();
    assertThat(evaluator.hasPermission(null, null, "game.play")).isFalse();
    verifyNoInteractions(access);
  }
}
