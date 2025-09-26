package aqms.domain.model;

import jakarta.persistence.*; import lombok.*;
@Entity @Getter @Setter @NoArgsConstructor
public class Patient {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  private String fullName; private String email; private String contactNumber;
}