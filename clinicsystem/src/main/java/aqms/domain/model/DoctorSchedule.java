package aqms.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
/**
 * DoctorSchedule
 *
 * Represents an availability block for a doctor. Used by the schedule management UI and by
 * services that generate appointment slots.
 */
public class DoctorSchedule {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  private Doctor doctor;

  private LocalDateTime startTime;
  private LocalDateTime endTime;
  private boolean available;
}
