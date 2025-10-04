package aqms.repository;
import org.springframework.data.jpa.repository.*; import aqms.domain.model.*; import aqms.domain.enums.*; 
import java.time.*; import java.util.*;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> { Optional<UserAccount> findByUsername(String username); List<UserAccount> findByRole(UserRole role);}
