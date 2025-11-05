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


  public String registerPatient(String username, String email, String rawPassword, String ignored) {
    if (users.existsByUsername(username)) {
      throw new IllegalStateException("Username taken");
    }
    var u = new UserAccount(username, email, encoder.encode(rawPassword), UserRole.PATIENT);
    users.save(u);
    return jwt.issueToken(u.getUsername(), u.getRole().name(), u.getId());
  }
  public String registerAdmin(String username, String email, String rawPassword, String ignored) {
    if (users.existsByUsername(username)) {
      throw new IllegalStateException("Username taken");
    }
    var u = new UserAccount(username, email, encoder.encode(rawPassword), UserRole.ADMIN);
    users.save(u);
    return jwt.issueToken(u.getUsername(), u.getRole().name(), u.getId());
  }

  public String registerStaff(String username, String email, String rawPassword, String ignored) {
  if (users.existsByUsername(username)) {
    throw new IllegalStateException("Username taken");
  }
  var u = new UserAccount(username, email, encoder.encode(rawPassword), UserRole.STAFF);
  users.save(u);
  return jwt.issueToken(u.getUsername(), u.getRole().name(), u.getId());
}
  public String login(String email, String rawPassword) {
    var u = users.findByEmail(email)
        .orElseThrow(() -> new IllegalStateException("Invalid Email or Password"));
    if (!encoder.matches(rawPassword, u.getPasswordHash())) {
      throw new IllegalStateException("Invalid Email or Password");
    }
    if (!u.isEnabled()) {
      throw new IllegalStateException("Account disabled");
    }
    return jwt.issueToken(u.getUsername(), u.getRole().name(), u.getId());
  }
}
