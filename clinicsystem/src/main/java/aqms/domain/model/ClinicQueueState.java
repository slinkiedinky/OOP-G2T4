package aqms.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clinic_queue_state", indexes = {@Index(columnList = "clinic_id", name = "idx_clinic_queue_state_clinic")})
public class ClinicQueueState {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "clinic_id", nullable = false, unique = true)
  private Long clinicId;

  @Column(name = "running", nullable = false)
  private boolean running = false;

  @Column(name = "paused", nullable = false)
  private boolean paused = false;

  @Column(name = "last_updated")
  private LocalDateTime lastUpdated;

  @Column(name = "last_reset_at")
  private LocalDateTime lastResetAt;

  public ClinicQueueState() {}

  public ClinicQueueState(Long clinicId) { this.clinicId = clinicId; }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public Long getClinicId() { return clinicId; }
  public void setClinicId(Long clinicId) { this.clinicId = clinicId; }

  public boolean isRunning() { return running; }
  public void setRunning(boolean running) { this.running = running; }

  public boolean isPaused() { return paused; }
  public void setPaused(boolean paused) { this.paused = paused; }

  public LocalDateTime getLastUpdated() { return lastUpdated; }
  public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

  public LocalDateTime getLastResetAt() { return lastResetAt; }
  public void setLastResetAt(LocalDateTime lastResetAt) { this.lastResetAt = lastResetAt; }
}
