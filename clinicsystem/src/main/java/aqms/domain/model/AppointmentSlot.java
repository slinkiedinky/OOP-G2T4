package aqms.domain.model;

import aqms.domain.enums.AppointmentStatus;
import jakarta.persistence.*; import lombok.*; import java.time.*;
@Entity @Getter @Setter @NoArgsConstructor
@Table(indexes={@Index(columnList="clinic_id,doctor_id,startTime"), @Index(columnList="status")})
public class AppointmentSlot {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(optional=false) private Clinic clinic;
  @ManyToOne(optional=false) private Doctor doctor;
  @ManyToOne private Patient patient;              // null when AVAILABLE
  private LocalDateTime startTime; private LocalDateTime endTime;
  @Enumerated(EnumType.STRING) private AppointmentStatus status = AppointmentStatus.AVAILABLE;
  @Version private Long version;                   // optimistic lock
}