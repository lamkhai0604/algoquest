package com.algoquest.access;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.EnumSet;
import org.junit.jupiter.api.Test;

class RoleCatalogueTest {

  @Test
  void ownerHoldsEveryPermission() {
    assertThat(Role.OWNER.permissions()).isEqualTo(EnumSet.allOf(Permission.class));
  }

  @Test
  void playerCanOnlyPlay() {
    assertThat(Role.PLAYER.permissions()).containsExactly(Permission.GAME_PLAY);
  }

  @Test
  void adminHasNoPermissionsUntilDefined() {
    assertThat(Role.ADMIN.permissions()).isEmpty();
  }

  @Test
  void permissionCodesMatchTheCatalogue() {
    assertThat(Permission.fromCode("admin.users.view")).contains(Permission.ADMIN_USERS_VIEW);
    assertThat(Permission.fromCode("game.play")).contains(Permission.GAME_PLAY);
    assertThat(Permission.fromCode("admin.everything")).isEmpty();
  }

  @Test
  void scopeTypeAndIdMustBeSetTogether() {
    assertThat(Scope.GLOBAL.isGlobal()).isTrue();
    assertThatThrownBy(() -> new Scope("organization", null))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
