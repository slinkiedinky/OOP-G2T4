package aqms.domain.model;

import aqms.domain.enums.UserRole;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; 

@Entity
@Table(name = "user_accounts")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})  
/**
 * UserAccount
 *
 * Represents a user in the system (patient, staff or admin). Contains
 * identifying information, role and enabled flag. Passwords are stored as
 * encoded hashes.
 */
public class UserAccount {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false)
  private String fullname;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UserRole role;

  @Column(length=20, name = "contact_number")
  private String contactNum;

  @Column(length=100, unique = true, nullable = false)
  private String email;

  @Column(nullable = false)
  private boolean enabled = true;

  public UserAccount() {}

  public UserAccount(String fullname, String email, String passwordHash, UserRole role) {
    this.fullname = fullname;
    this.passwordHash = passwordHash;
    this.email = email;
    this.role = role;
    this.enabled = true;
  }

  public Long getId() { return id; }


  public String getEmail() {return email;}
  public void setEmail(String email){this.email = email;}

  public String getContactNumber() {return contactNum;}
  public void setContactNumber(String contactNum){this.contactNum=contactNum;}

  public String getFullname() { return fullname; }
  public void setFullname(String fullname) { this.fullname = fullname; }

  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

  public UserRole getRole() { return role; }
  public void setRole(UserRole role) { this.role = role; }

  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
