package aqms.repository;

import aqms.domain.enums.UserRole;
import aqms.domain.model.UserAccount;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
  boolean existsByEmail(String email);
  Optional<UserAccount> findByFullname(String fullname);
  List<UserAccount> findByRole(UserRole role);
  Optional<UserAccount> findByEmail(String email);
}
