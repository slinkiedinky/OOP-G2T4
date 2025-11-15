package aqms.domain.model;

import aqms.domain.enums.*;
import jakarta.persistence.*;
import java.time.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(indexes = @Index(columnList = "clinic_id,status,createdAt"))
/**
 * QueueTicket
 *
 * Represents a persistent ticket issued in the queue system. Contains a reference to the
 * appointment, its numeric label and priority.
 */
public class QueueTicket {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  private Clinic clinic;

  @OneToOne(optional = false)
  private AppointmentSlot appointment;

  private String number;
  private Integer position;

  @Enumerated(EnumType.STRING)
  private QueuePriority priority = QueuePriority.NORMAL;

  @Enumerated(EnumType.STRING)
  private QueueStatus status = QueueStatus.WAITING;

  private LocalDateTime createdAt = LocalDateTime.now();
}
