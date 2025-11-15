package aqms.service;

import aqms.domain.enums.UserRole;
import aqms.domain.model.UserAccount;
import aqms.repository.UserAccountRepository;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
/**
 * UserService
 *
 * Responsibilities: - Create, update and delete user accounts. - Provide query methods for user
 * listings and lookups.
 *
 * Notes: - Passwords are encoded with a PasswordEncoder before persistence.
 */
public class UserService {
  private final UserAccountRepository users;
  private final PasswordEncoder enc;

  public UserService(UserAccountRepository users, PasswordEncoder enc) {
    this.users = users;
    this.enc = enc;
  }

  public List<UserAccount> getAllUsers(UserRole role) {
    if (role == null) {
      return users.findAll();
    }
    return users.findByRole(role);
  }

  public UserAccount createUser(
      String fullname, String rawPassword, UserRole role, String email, String contactNum) {
    if (users.findByEmail(email).isPresent()) {
      throw new RuntimeException("Email already exists");
    }
    UserAccount u = new UserAccount();
    u.setEmail(email);
    u.setPasswordHash(enc.encode(rawPassword));
    u.setRole(role);
    u.setEnabled(true);
    u.setFullname(fullname);
    u.setContactNumber(contactNum);
    return users.save(u);
  }

  public void deleteUser(Long id) {
    users.deleteById(id);
  }

  public UserAccount updateUser(
      Long id,
      String fullname,
      String rawPassword,
      String role,
      Boolean enabled,
      String email,
      String contactNum) {
    UserAccount u = users.findById(id).orElseThrow(() -> new RuntimeException("User not found!"));
    if (fullname != null) u.setFullname(fullname);
    if (rawPassword != null) u.setPasswordHash(enc.encode(rawPassword));
    if (role != null) u.setRole(UserRole.valueOf(role.toUpperCase()));
    if (enabled != null) u.setEnabled(enabled);
    if (email != null) u.setEmail(email);
    if (contactNum != null) u.setContactNumber(contactNum);

    return users.save(u);
  }

  public UserAccount getUserbyId(Long id) {
    return users.findById(id).orElseThrow(() -> new RuntimeException("User not found!"));
  }

  // public void sendPasswordReset()
  // Need to make token too

}
