package aqms.domain.model;

import aqms.domain.enums.AppointmentStatus;
import jakarta.persistence.*;
import jakarta.persistence.FetchType;
import java.time.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(
    indexes = {@Index(columnList = "clinic_id,doctor_id,startTime"), @Index(columnList = "status")})
/**
 * AppointmentSlot
 *
 * Represents a single appointment time slot in a clinic. Slots may be AVAILABLE, BOOKED,
 * CHECKED_IN, CANCELLED, COMPLETED or NO_SHOW. Links to clinic, optional doctor and optional
 * patient.
 */
public class AppointmentSlot {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  private Clinic clinic;

  @ManyToOne(optional = true)
  private Doctor doctor;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "patient_id", nullable = true)
  private UserAccount patient; // null when AVAILABLE; references user_accounts

  private LocalDateTime startTime;
  private LocalDateTime endTime;

  @Enumerated(EnumType.STRING)
  private AppointmentStatus status = AppointmentStatus.AVAILABLE;

  @Version private Long version;

  @Column(length = 2000)
  private String treatmentSummary;
}
