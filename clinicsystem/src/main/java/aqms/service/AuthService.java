package aqms.service;

import aqms.domain.enums.UserRole;
import aqms.domain.model.Patient;
import aqms.domain.model.UserAccount;
import aqms.repository.PatientRepository;
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
  private final PatientRepository patients;

  public String registerPatient(String username, String rawPassword, String ignored) {
    if (users.existsByUsername(username)) {
      throw new IllegalStateException("Username taken");
    }
    var u = new UserAccount(username, encoder.encode(rawPassword), UserRole.PATIENT);
    users.save(u);
    
    // Create Patient record
    var patient = new Patient();
    patient.setEmail(username);
    patient.setFullName(username); // Default to username, can be updated later
    patient.setContactNumber(""); // Empty for now
    patients.save(patient);
    
    return jwt.issueToken(u.getUsername(), u.getRole().name());
  }
  public String registerAdmin(String username, String rawPassword, String ignored) {
    if (users.existsByUsername(username)) {
      throw new IllegalStateException("Username taken");
    }
    var u = new UserAccount(username, encoder.encode(rawPassword), UserRole.ADMIN);
    users.save(u);
    return jwt.issueToken(u.getUsername(), u.getRole().name());
  }

  public String registerStaff(String username, String rawPassword, String ignored) {
  if (users.existsByUsername(username)) {
    throw new IllegalStateException("Username taken");
  }
  var u = new UserAccount(username, encoder.encode(rawPassword), UserRole.STAFF);
  users.save(u);
  return jwt.issueToken(u.getUsername(), u.getRole().name());
}
  public String login(String username, String rawPassword) {
    var u = users.findByUsername(username)
        .orElseThrow(() -> new IllegalStateException("Bad credentials"));
    if (!encoder.matches(rawPassword, u.getPasswordHash())) {
      throw new IllegalStateException("Bad credentials");
    }
    if (!u.isEnabled()) {
      throw new IllegalStateException("Account disabled");
    }
    return jwt.issueToken(u.getUsername(), u.getRole().name());
  }
}
