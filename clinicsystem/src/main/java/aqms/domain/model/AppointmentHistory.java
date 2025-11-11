package aqms.domain.model;

import jakarta.persistence.*; import lombok.*; import java.time.*;
@Entity @Getter @Setter @NoArgsConstructor
/**
 * AppointmentHistory
 *
 * Simple audit record for appointment lifecycle events (booked,
 * rescheduled, cancelled, checked-in, completed). Stored with a timestamp
 * and optional details.
 */
public class AppointmentHistory {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(optional=false) private AppointmentSlot slot;
  private String action; private String actor; private LocalDateTime at = LocalDateTime.now(); private String details;
}