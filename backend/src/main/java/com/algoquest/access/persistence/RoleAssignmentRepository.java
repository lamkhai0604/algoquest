package com.algoquest.access.persistence;

import com.algoquest.access.Role;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleAssignmentRepository extends JpaRepository<RoleAssignment, UUID> {

  List<RoleAssignment> findByUserId(UUID userId);

  List<RoleAssignment> findByUserIdIn(List<UUID> userIds);

  /** Locks every global assignment of a role, so concurrent removals see the same count. */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from RoleAssignment r where r.role = :role and r.scopeType is null")
  List<RoleAssignment> lockGlobalByRole(@Param("role") Role role);
}
