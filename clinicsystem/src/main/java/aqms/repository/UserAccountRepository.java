package aqms.repository;

import aqms.domain.enums.UserRole;
import aqms.domain.model.UserAccount;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * UserAccountRepository
 *
 * Repository for user account persistence. Provides lookups by email, role and fullname used by
 * authentication and admin user management.
 */
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
  boolean existsByEmail(String email);

  Optional<UserAccount> findByFullname(String fullname);

  List<UserAccount> findByRole(UserRole role);

  Optional<UserAccount> findByEmail(String email);
}
