package aqms.service;

import aqms.domain.enums.QueueStatus;
import aqms.domain.model.AppointmentSlot;
import aqms.domain.model.QueueEntry;
import aqms.repository.AppointmentSlotRepository;
import aqms.repository.QueueEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class QueueService {
  private final QueueEntryRepository queueRepo;
  private final AppointmentSlotRepository slotRepo;

  // In-memory control flags per clinic (non-persistent)
  private final Map<Long, Boolean> running = new HashMap<>();
  private final Map<Long, Boolean> paused = new HashMap<>();

  @Transactional
  public QueueEntry enqueue(Long slotId) {
    var slot = slotRepo.findById(slotId).orElseThrow();
    // if already enqueued, return existing
    var existing = queueRepo.findBySlotId(slotId);
    if (existing.isPresent()) return existing.get();

    Long clinicId = slot.getClinic().getId();
    // determine today's range (auto-reset at midnight)
    LocalDate today = LocalDate.now();
    LocalDateTime from = today.atStartOfDay();
    LocalDateTime to = today.atTime(LocalTime.MAX);
    var todays = queueRepo.findByClinicAndCreatedAtBetweenOrderByQueueNumber(clinicId, from, to);
    int next = 1;
    if (!todays.isEmpty()) {
      Integer max = todays.get(todays.size()-1).getQueueNumber();
      next = (max == null ? todays.size()+1 : max + 1);
    }

    var entry = new QueueEntry();
    entry.setClinicId(clinicId);
    entry.setSlot(slot);
    entry.setQueueNumber(next);
    entry.setStatus(QueueStatus.QUEUED);
    entry.setCreatedAt(LocalDateTime.now());
    entry.setDoctorName(slot.getDoctor() != null ? slot.getDoctor().getName() : null);
    queueRepo.save(entry);
    return entry;
  }

  // (manual reset removed - queue numbers reset automatically at midnight)

  @Transactional(readOnly = true)
  public List<QueueEntry> getQueueStatus(Long clinicId) {
    LocalDate today = LocalDate.now();
    LocalDateTime from = today.atStartOfDay();
    LocalDateTime to = today.atTime(LocalTime.MAX);
    return queueRepo.findByClinicAndCreatedAtBetweenOrderByQueueNumber(clinicId, from, to);
  }

  /**
   * Return queue entries for a specific clinic for the provided date.
   * The provided date is interpreted as a UTC calendar day; the method
   * converts UTC day boundaries into server local LocalDateTime values
   * so the DB timestamp comparison uses the server timezone consistently.
   */
  @Transactional(readOnly = true)
  public List<QueueEntry> getQueueStatus(Long clinicId, LocalDate dateUtc) {
    // compute UTC day boundaries then convert to server local time
    Instant startUtc = dateUtc.atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant endUtc = dateUtc.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant();
    ZoneId sys = ZoneId.systemDefault();
    LocalDateTime from = LocalDateTime.ofInstant(startUtc, sys);
    LocalDateTime to = LocalDateTime.ofInstant(endUtc, sys);
    return queueRepo.findByClinicAndCreatedAtBetweenOrderByQueueNumber(clinicId, from, to);
  }

  @Transactional(readOnly = true)
  public List<QueueEntryView> getQueueStatusView(Long clinicId) {
    LocalDate today = LocalDate.now();
    LocalDateTime from = today.atStartOfDay();
    LocalDateTime to = today.atTime(LocalTime.MAX);
    var list = queueRepo.findByClinicAndCreatedAtBetweenOrderByQueueNumber(clinicId, from, to);
    List<QueueEntryView> views = new ArrayList<>();
    for (var e : list) {
      var slot = e.getSlot();
      Long appointmentId = slot != null ? slot.getId() : null;
      java.time.LocalDateTime time = slot != null ? slot.getStartTime() : null;
      Long patientId = null;
      String patientName = null;
      if (slot != null && slot.getPatient() != null) {
        patientId = slot.getPatient().getId();
        patientName = slot.getPatient().getName();
      }
      views.add(new QueueEntryView(
          e.getId(),
          e.getQueueNumber(),
          e.getStatus(),
          appointmentId,
          time,
          patientId,
          patientName,
          e.getDoctorName(),
          e.getRoom(),
          e.getCalledAt(),
          e.getCreatedAt(),
          e.getFastTracked(),
          e.getFastTrackedAt(),
          e.getFastTrackReason()));
    }
    return views;
  }

  @Transactional(readOnly = true)
  public List<QueueEntryView> getQueueStatusView(Long clinicId, LocalDate dateUtc) {
    Instant startUtc = dateUtc.atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant endUtc = dateUtc.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant();
    ZoneId sys = ZoneId.systemDefault();
    LocalDateTime from = LocalDateTime.ofInstant(startUtc, sys);
    LocalDateTime to = LocalDateTime.ofInstant(endUtc, sys);
    var list = queueRepo.findByClinicAndCreatedAtBetweenOrderByQueueNumber(clinicId, from, to);
    List<QueueEntryView> views = new ArrayList<>();
    for (var e : list) {
      var slot = e.getSlot();
      Long appointmentId = slot != null ? slot.getId() : null;
      java.time.LocalDateTime time = slot != null ? slot.getStartTime() : null;
      Long patientId = null;
      String patientName = null;
      if (slot != null && slot.getPatient() != null) {
        patientId = slot.getPatient().getId();
        patientName = slot.getPatient().getName();
      }
      views.add(new QueueEntryView(
          e.getId(),
          e.getQueueNumber(),
          e.getStatus(),
          appointmentId,
          time,
          patientId,
          patientName,
          e.getDoctorName(),
          e.getRoom(),
          e.getCalledAt(),
          e.getCreatedAt(),
          e.getFastTracked(),
          e.getFastTrackedAt(),
          e.getFastTrackReason()));
    }
    return views;
  }

  @Transactional(readOnly = true)
  public List<QueueEntryView> getAllQueueStatusView(Long clinicId) {
    var list = queueRepo.findByClinicIdOrderByCreatedAtDesc(clinicId);
    List<QueueEntryView> views = new ArrayList<>();
    for (var e : list) {
      var slot = e.getSlot();
      Long appointmentId = slot != null ? slot.getId() : null;
      java.time.LocalDateTime time = slot != null ? slot.getStartTime() : null;
      Long patientId = null;
      String patientName = null;
      if (slot != null && slot.getPatient() != null) {
        patientId = slot.getPatient().getId();
        patientName = slot.getPatient().getName();
      }
      views.add(new QueueEntryView(
          e.getId(),
          e.getQueueNumber(),
          e.getStatus(),
          appointmentId,
          time,
          patientId,
          patientName,
          e.getDoctorName(),
          e.getRoom(),
          e.getCalledAt(),
          e.getCreatedAt(),
          e.getFastTracked(),
          e.getFastTrackedAt(),
          e.getFastTrackReason()));
    }
    return views;
  }

  @Transactional(readOnly = true)
  public Optional<QueueEntry> findBySlotId(Long slotId) {
    return queueRepo.findBySlotId(slotId);
  }

  @Transactional
  public QueueEntry callNext(Long clinicId) {
    // Prefer any fast-tracked queued entry (ordered by fastTrackedAt)
    var ftOpt = queueRepo.findTopByClinicIdAndStatusAndFastTrackedTrueOrderByFastTrackedAtAsc(clinicId, QueueStatus.QUEUED);
    if (ftOpt.isPresent()) {
      var ft = ftOpt.get();
      ft.setStatus(QueueStatus.CALLED);
      ft.setCalledAt(LocalDateTime.now());
      // clear fastTracked flag once called
      ft.setFastTracked(false);
      ft.setFastTrackedAt(null);
      queueRepo.save(ft);
      return ft;
    }
    var nextOpt = queueRepo.findTopByClinicIdAndStatusOrderByQueueNumberAsc(clinicId, QueueStatus.QUEUED);
    if (nextOpt.isEmpty()) throw new NoSuchElementException("No queued patients");
    var next = nextOpt.get();
    next.setStatus(QueueStatus.CALLED);
    next.setCalledAt(LocalDateTime.now());
    queueRepo.save(next);
    return next;
  }

  @Transactional
  public QueueEntry fastTrack(Long appointmentId, String reason) {
    var entryOpt = queueRepo.findBySlotId(appointmentId);
    if (entryOpt.isEmpty()) throw new IllegalArgumentException("Queue entry not found");
    var entry = entryOpt.get();
    // mark as fast-tracked so callNext will prefer it; keep queueNumber unchanged
    entry.setFastTracked(true);
    entry.setFastTrackedAt(LocalDateTime.now());
    entry.setFastTrackReason(reason);
    // ensure status is QUEUED so it remains in the queued pool
    entry.setStatus(QueueStatus.QUEUED);
    queueRepo.save(entry);
    return entry;
  }

  public void startQueue(Long clinicId) {
    running.put(clinicId, true);
    paused.put(clinicId, false);
  }

  public void pauseQueue(Long clinicId) {
    paused.put(clinicId, true);
  }

  public void resumeQueue(Long clinicId) {
    paused.put(clinicId, false);
  }

  public boolean isRunning(Long clinicId) { return running.getOrDefault(clinicId, false); }
  public boolean isPaused(Long clinicId) { return paused.getOrDefault(clinicId, false); }
}

