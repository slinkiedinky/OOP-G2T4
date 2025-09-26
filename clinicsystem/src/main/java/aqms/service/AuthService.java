package aqms.service;

import aqms.domain.enums.UserRole;
import aqms.domain.model.UserAccount;
import aqms.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class AuthService {
  private final UserAccountRepository users; private final PasswordEncoder enc; private final JwtService jwt;

  public String registerPatient(String username, String rawPassword, Long patientId){
    users.findByUsername(username).ifPresent(u -> { throw new IllegalStateException("Username taken"); });
    var u = new UserAccount(); u.setUsername(username); u.setPasswordHash(enc.encode(rawPassword));
    u.setRole(UserRole.PATIENT); u.setPatientId(patientId); users.save(u);
    return jwt.createToken(u.getUsername(), u.getRole().name());
  }
  public String login(String username, String rawPassword){
    var u = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("Bad credentials"));
    if (!u.isEnabled() || !enc.matches(rawPassword, u.getPasswordHash())) throw new IllegalArgumentException("Bad credentials");
    return jwt.createToken(u.getUsername(), u.getRole().name());
  }
}

