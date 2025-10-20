package aqms.domain.model;

import aqms.domain.enums.UserRole;
import jakarta.persistence.*;

@Entity
@Table(name = "user_accounts")
public class UserAccount {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false)
  private String username;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UserRole role;

  @Column(nullable = false)
  private boolean enabled = true;

  public UserAccount() {}

  public UserAccount(String username, String passwordHash, UserRole role) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.role = role;
    this.enabled = true;
  }

  public Long getId() { return id; }

  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }

  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

  public UserRole getRole() { return role; }
  public void setRole(UserRole role) { this.role = role; }

  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
