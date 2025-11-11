package aqms.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "queue_entries", indexes = {@Index(columnList = "clinic_id, queue_number")})
/**
 * QueueEntry
 *
 * Represents an entry in a clinic's live queue. Stores the linked
 * AppointmentSlot, assigned queue number, current status and timestamps for
 * created/called events.
 */
public class QueueEntry {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private Long clinicId;
  @ManyToOne(optional = false)
  private AppointmentSlot slot;
  private Integer queueNumber;
  @Enumerated(EnumType.STRING)
  private aqms.domain.enums.QueueStatus status = aqms.domain.enums.QueueStatus.QUEUED;
  private LocalDateTime createdAt = LocalDateTime.now();
  private LocalDateTime calledAt;
  private String room;
  private String doctorName;
  // fast-track metadata
  private Boolean fastTracked = false;
  private LocalDateTime fastTrackedAt;
  private String fastTrackReason;

  public Long getId() { return id; }
  public Long getClinicId() { return clinicId; }
  public void setClinicId(Long clinicId) { this.clinicId = clinicId; }
  public AppointmentSlot getSlot() { return slot; }
  public void setSlot(AppointmentSlot slot) { this.slot = slot; }
  public Integer getQueueNumber() { return queueNumber; }
  public void setQueueNumber(Integer queueNumber) { this.queueNumber = queueNumber; }
  public aqms.domain.enums.QueueStatus getStatus() { return status; }
  public void setStatus(aqms.domain.enums.QueueStatus status) { this.status = status; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getCalledAt() { return calledAt; }
  public void setCalledAt(LocalDateTime calledAt) { this.calledAt = calledAt; }
  public String getRoom() { return room; }
  public void setRoom(String room) { this.room = room; }
  public String getDoctorName() { return doctorName; }
  public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
  public Boolean getFastTracked() { return fastTracked; }
  public void setFastTracked(Boolean fastTracked) { this.fastTracked = fastTracked; }
  public LocalDateTime getFastTrackedAt() { return fastTrackedAt; }
  public void setFastTrackedAt(LocalDateTime fastTrackedAt) { this.fastTrackedAt = fastTrackedAt; }
  public String getFastTrackReason() { return fastTrackReason; }
  public void setFastTrackReason(String fastTrackReason) { this.fastTrackReason = fastTrackReason; }
}
