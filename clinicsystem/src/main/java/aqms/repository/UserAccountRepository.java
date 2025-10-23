package aqms.repository;

import aqms.domain.enums.UserRole;
import aqms.domain.model.UserAccount;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
  boolean existsByUsername(String username);
  Optional<UserAccount> findByUsername(String username);
  List<UserAccount> findByRole(UserRole role);
  Optional<UserAccount> findByEmail(String email);
}
