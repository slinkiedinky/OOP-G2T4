package aqms.domain.model;

import aqms.domain.enums.UserRole;
import jakarta.persistence.*; import lombok.*;
@Entity @Getter @Setter @NoArgsConstructor
@Table(name="users", indexes=@Index(columnList="username", unique=true))
public class UserAccount {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @Column(nullable=false, unique=true) private String username;
  @Column(nullable=false) private String passwordHash;
  @Enumerated(EnumType.STRING) @Column(nullable=false) private UserRole role;
  private boolean enabled = true;
  private Long patientId; private Long staffId;
}