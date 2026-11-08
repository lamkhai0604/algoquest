package com.algoquest.access;

import java.util.UUID;

/** The principal of an authenticated request: only the user ID (D-036). */
public record AuthenticatedUser(UUID id) {}
