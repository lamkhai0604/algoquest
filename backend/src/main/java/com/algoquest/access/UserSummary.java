package com.algoquest.access;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** A user with their global roles, for the admin users page (FR-18.4). */
public record UserSummary(
    UUID id, String email, String displayName, List<Role> roles, Instant createdAt) {}
