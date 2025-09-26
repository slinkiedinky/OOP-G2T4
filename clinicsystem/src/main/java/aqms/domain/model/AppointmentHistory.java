package aqms.domain.model;

import jakarta.persistence.*; import lombok.*; import java.time.*;
@Entity @Getter @Setter @NoArgsConstructor
public class AppointmentHistory {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(optional=false) private AppointmentSlot slot;
  private String action; private String actor; private LocalDateTime at = LocalDateTime.now(); private String details;
}