package aqms.service;

import aqms.domain.enums.UserRole;

import aqms.domain.model.UserAccount;

import aqms.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserAccountRepository users;
  private final PasswordEncoder encoder;
  private final JwtService jwt;


  public String registerPatient(String username, String rawPassword, String ignored) {
    if (users.existsByUsername(username)) {
      throw new IllegalStateException("Username taken");
    }
    var u = new UserAccount(username, encoder.encode(rawPassword), UserRole.PATIENT);
    users.save(u);
    return jwt.issueToken(u.getUsername(), u.getRole().name(), u.getId());
  }
  public String registerAdmin(String username, String rawPassword, String ignored) {
    if (users.existsByUsername(username)) {
      throw new IllegalStateException("Username taken");
    }
    var u = new UserAccount(username, encoder.encode(rawPassword), UserRole.ADMIN);
    users.save(u);
    return jwt.issueToken(u.getUsername(), u.getRole().name(), u.getId());
  }

  public String registerStaff(String username, String rawPassword, String ignored) {
  if (users.existsByUsername(username)) {
    throw new IllegalStateException("Username taken");
  }
  var u = new UserAccount(username, encoder.encode(rawPassword), UserRole.STAFF);
  users.save(u);
  return jwt.issueToken(u.getUsername(), u.getRole().name(), u.getId());
}
  public String login(String username, String rawPassword) {
  var u = users.findByUsername(username)
      .orElseThrow(() -> new IllegalStateException("Invalid username or password"));
  if (!encoder.matches(rawPassword, u.getPasswordHash())) {
    throw new IllegalStateException("Invalid username or password");
  }
    if (!u.isEnabled()) {
      throw new IllegalStateException("Account disabled");
    }
    return jwt.issueToken(u.getUsername(), u.getRole().name(), u.getId());
  }
}
