package aqms.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity @Getter @Setter @NoArgsConstructor
public class DoctorSchedule {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(optional=false) private Doctor doctor;
  private LocalDateTime startTime; private LocalDateTime endTime; private boolean available; 
}
