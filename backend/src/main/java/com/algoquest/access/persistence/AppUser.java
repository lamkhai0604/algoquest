package com.algoquest.access.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class AppUser {

  @Id private UUID id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "display_name", nullable = false)
  private String displayName;

  @Column(nullable = false)
  private String provider;

  @Column(name = "provider_subject", nullable = false)
  private String providerSubject;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected AppUser() {}

  public AppUser(
      UUID id,
      String email,
      String displayName,
      String provider,
      String providerSubject,
      Instant createdAt) {
    this.id = id;
    this.email = email;
    this.displayName = displayName;
    this.provider = provider;
    this.providerSubject = providerSubject;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public String getDisplayName() {
    return displayName;
  }

  public String getProvider() {
    return provider;
  }

  public String getProviderSubject() {
    return providerSubject;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }
}
