package com.algoquest.access.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

  Optional<AppUser> findByProviderAndProviderSubject(String provider, String providerSubject);

  Optional<AppUser> findByEmail(String email);

  List<AppUser> findAllByOrderByCreatedAtAsc();
}
