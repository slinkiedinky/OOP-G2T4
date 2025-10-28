package aqms.domain.model;

import aqms.domain.enums.AppointmentStatus;
import jakarta.persistence.FetchType;
import jakarta.persistence.*; import lombok.*; import java.time.*;
@Entity @Getter @Setter @NoArgsConstructor
@Table(indexes={@Index(columnList="clinic_id,doctor_id,startTime"), @Index(columnList="status")})
public class AppointmentSlot {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(optional=false) private Clinic clinic;
  @ManyToOne(optional=true) private Doctor doctor;
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "patient_id", nullable = true)
  private UserAccount patient;              // null when AVAILABLE; references user_accounts
  private LocalDateTime startTime; private LocalDateTime endTime;
  @Enumerated(EnumType.STRING) private AppointmentStatus status = AppointmentStatus.AVAILABLE;
  @Version private Long version;                   // optimistic lock
}