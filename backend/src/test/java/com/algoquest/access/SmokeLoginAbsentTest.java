package com.algoquest.access;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.algoquest.access.smoke.SmokeLoginController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/** The test-only sign-in must not exist outside the smoke profile (sprint 1 risk register). */
@SpringBootTest
@ActiveProfiles("test")
class SmokeLoginAbsentTest {

  @Autowired private WebApplicationContext context;

  @Test
  void testLoginIsAbsentInTheDefaultProfiles() throws Exception {
    assertThat(context.getBeanNamesForType(SmokeLoginController.class)).isEmpty();
    MockMvc mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    mvc.perform(get("/test-login").param("email", "owner@example.com"))
        .andExpect(status().isNotFound());
  }
}
