package aqms.domain.model;

import jakarta.persistence.*; import lombok.*;
@Entity @Getter @Setter @NoArgsConstructor
/**
 * Doctor
 *
 * Basic doctor profile linked to a Clinic. Contains name, specialization and
 * simple availability flags used by slot generation.
 */
public class Doctor {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(optional=false) private Clinic clinic;
  private String name; private String specialization;
  private Boolean morning; private Boolean afternoon;
}