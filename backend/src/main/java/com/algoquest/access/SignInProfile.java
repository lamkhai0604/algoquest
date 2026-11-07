package com.algoquest.access;

/** What a sign-in provider tells us about the user. */
public record SignInProfile(
    String provider, String providerSubject, String email, String displayName) {}
