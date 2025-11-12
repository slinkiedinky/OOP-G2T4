package aqms.service;

import aqms.domain.enums.AppointmentStatus;
import aqms.domain.enums.QueueStatus;
import aqms.domain.model.AppointmentSlot;
import aqms.domain.model.QueueEntry;
import aqms.repository.AppointmentSlotRepository;
import aqms.repository.QueueEntryRepository;
import aqms.repository.ClinicQueueStateRepository;
import aqms.domain.model.ClinicQueueState;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
/**
 * QueueService
 *
 * Core queue management logic: enqueueing patients, calling the next
 * patient, fast-tracking, and producing queue views for the UI.
 *
 * Persists minimal state and keeps transient running/paused flags in-memory.
 */
public class QueueService {
  private final QueueEntryRepository queueRepo;
  private final AppointmentSlotRepository slotRepo;
  private final ClinicQueueStateRepository stateRepo;
  private final NotificationService notificationService;

  // In-memory control flags per clinic (non-persistent)
  private final Map<Long, Boolean> running = new HashMap<>();
  private final Map<Long, Boolean> paused = new HashMap<>();

  // helper: compute the lower bound for today's queue entries for a clinic
  private LocalDateTime computeFromBoundary(Long clinicId) {
    LocalDate today = LocalDate.now();
    LocalDateTime todayStart = today.atStartOfDay();
    try {
      var sOpt = stateRepo.findByClinicId(clinicId);
      if (sOpt.isPresent()) {
        var lastReset = sOpt.get().getLastResetAt();
        if (lastReset != null) return lastReset;
      }
    } catch (Exception ignored) {}
    return todayStart;
  }

  @Transactional
  public QueueEntry enqueue(Long slotId) {
    var slot = slotRepo.findById(slotId).orElseThrow();
    // if already enqueued, return existing
    var existing = queueRepo.findBySlotId(slotId);
    if (existing.isPresent()) return existing.get();

    Long clinicId = slot.getClinic().getId();
  // determine today's range (respect lastResetAt if present)
  LocalDateTime from = computeFromBoundary(clinicId);
  LocalDateTime to = LocalDate.now().atTime(LocalTime.MAX);
  
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

    var todaysQueuedbutNotCalled = queueRepo.findByClinicAndStatusAndCreatedAtBetweenOrderByQueueNumber(clinicId,QueueStatus.QUEUED, from, to);

    try {
          System.out.println("🔥 SENDING EMAIL NOW...");
          notificationService.notifyPatientQueue(
          slot.getPatient().getEmail(),
          clinicId,
          next,
          todaysQueuedbutNotCalled.size()
      );
  } catch (Exception e) {
      System.err.println("Failed to send queue notification: " + e.getMessage());
  }
    return entry;
  }

  // (manual reset removed - queue numbers reset automatically at midnight)

  @Transactional(readOnly = true)
  public List<QueueEntry> getQueueStatus(Long clinicId) {
    LocalDateTime from = computeFromBoundary(clinicId);
    LocalDateTime to = LocalDate.now().atTime(LocalTime.MAX);
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
    LocalDateTime from = computeFromBoundary(clinicId);
    LocalDateTime to = LocalDate.now().atTime(LocalTime.MAX);
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
        patientName = slot.getPatient().getFullname();
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
        patientName = slot.getPatient().getFullname();
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
        patientName = slot.getPatient().getFullname();
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

    // ✅ Validate no CALLED/SERVING is still active
    try {
        var list = getQueueStatusView(clinicId);
        var active = list.stream()
            .filter(e -> e.status() == QueueStatus.CALLED || e.status() == QueueStatus.SERVING)
            .toList();

        for (var e : active) {
            Long slotId = e.appointmentId();
            if (slotId == null) 
                throw new IllegalStateException("Cannot call next: unfinished patient.");

            var slot = slotRepo.findById(slotId)
                .orElseThrow(() -> new IllegalStateException("Slot not found"));

            boolean completed = slot.getStatus() == AppointmentStatus.COMPLETED;
            boolean hasSummary = slot.getTreatmentSummary() != null && !slot.getTreatmentSummary().isBlank();

            if (!completed || !hasSummary)
                throw new IllegalStateException("Cannot call next: current patient not completed.");
        }

    } catch (IllegalStateException ex) {
        throw ex;
    } catch (Exception ignored) {}

    // ✅ Prefer fast-track
    var ftOpt = queueRepo.findTopByClinicIdAndStatusAndFastTrackedTrueOrderByFastTrackedAtAsc(clinicId, QueueStatus.QUEUED);
    QueueEntry next;

    if (ftOpt.isPresent()) {
        next = ftOpt.get();
        next.setStatus(QueueStatus.CALLED);
        next.setCalledAt(LocalDateTime.now());
        next.setFastTracked(false);
        next.setFastTrackedAt(null);
        queueRepo.save(next);
    } else {
        next = queueRepo.findTopByClinicIdAndStatusOrderByQueueNumberAsc(clinicId, QueueStatus.QUEUED)
            .orElseThrow(() -> new NoSuchElementException("No queued patients"));
        next.setStatus(QueueStatus.CALLED);
        next.setCalledAt(LocalDateTime.now());
        queueRepo.save(next);
    }

    // ✅ Notify the next patient
   try {

        var patient = next.getSlot().getPatient();
        if (patient != null && patient.getEmail() != null) {
            notificationService.notifyNextInLine(
                patient.getEmail(),
                clinicId,
                next.getQueueNumber()
            );
        }
    } catch (Exception e) {
        System.err.println("Failed to send next-in-line notification: " + e.getMessage());
    }

    // ✅ Notify remaining patients about their updated position
    try {
        List<QueueEntry> todays = queueRepo.findByClinicIdAndStatusOrderByQueueNumberAsc(clinicId, QueueStatus.QUEUED);

        int index = 0;
        for (var entry : todays) {
            if (entry.getId().equals(next.getId())) {
                index++;
                continue;
            }

            var slot = entry.getSlot();
            if (slot == null || slot.getPatient() == null) {
                index++;
                continue;
            }

            String email = slot.getPatient().getEmail();
            if (email == null) {
                index++;
                continue;
            }

            notificationService.notifyPatientQueue(
                email,
                clinicId,
                entry.getQueueNumber(),
                index  
            );
            index++;
        }
    } catch (Exception e) {
        System.err.println("Failed to send queue updates: " + e.getMessage());
    }

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

    try {
      var slot = entry.getSlot();
      var patient = slot.getPatient();
      var email = patient.getEmail();
      var clinicId = entry.getClinicId();

      notificationService.notifyFastTrackedPatient(email, clinicId, entry.getQueueNumber(), reason);
  } catch (Exception e) {
      System.err.println("Failed to send fast-track notification: " + e.getMessage());
  }

  return entry;
  }

  public void startQueue(Long clinicId) {
    running.put(clinicId, true);
    paused.put(clinicId, false);
    // persist state
    try {
      var sOpt = stateRepo.findByClinicId(clinicId);
      ClinicQueueState s = sOpt.orElseGet(() -> new ClinicQueueState(clinicId));
      s.setRunning(true);
      s.setPaused(false);
      s.setLastUpdated(java.time.LocalDateTime.now());
      stateRepo.save(s);
    } catch (Exception ignored) {}
  }

  public void pauseQueue(Long clinicId) {
    paused.put(clinicId, true);
    try {
      var sOpt = stateRepo.findByClinicId(clinicId);
      ClinicQueueState s = sOpt.orElseGet(() -> new ClinicQueueState(clinicId));
      s.setPaused(true);
      s.setLastUpdated(java.time.LocalDateTime.now());
      stateRepo.save(s);
    } catch (Exception ignored) {}
  }

  public void resumeQueue(Long clinicId) {
    paused.put(clinicId, false);
    try {
      var sOpt = stateRepo.findByClinicId(clinicId);
      ClinicQueueState s = sOpt.orElseGet(() -> new ClinicQueueState(clinicId));
      s.setPaused(false);
      s.setLastUpdated(java.time.LocalDateTime.now());
      stateRepo.save(s);
    } catch (Exception ignored) {}
  }

  public boolean isRunning(Long clinicId) {
    boolean inMem = running.getOrDefault(clinicId, false);
    if (inMem) return true;
    // check persisted state first
    try {
      var sOpt = stateRepo.findByClinicId(clinicId);
      if (sOpt.isPresent()) return sOpt.get().isRunning();
    } catch (Exception ignored) {}
    // fallback: if there are any QUEUED or CALLED or SERVING entries in DB, consider it running
    var statuses = java.util.List.of(aqms.domain.enums.QueueStatus.QUEUED, aqms.domain.enums.QueueStatus.CALLED, aqms.domain.enums.QueueStatus.SERVING);
    try {
      return queueRepo.existsByClinicIdAndStatusIn(clinicId, statuses);
    } catch (Exception e) {
      // If DB check fails for any reason, fall back to in-memory flag
      return inMem;
    }
  }

  public boolean isPaused(Long clinicId) {
    boolean inMem = paused.getOrDefault(clinicId, false);
    if (inMem) return true;
    try {
      var sOpt = stateRepo.findByClinicId(clinicId);
      if (sOpt.isPresent()) return sOpt.get().isPaused();
    } catch (Exception ignored) {}
    return inMem;
  }

  /**
   * Scheduled reset that runs at local midnight each day.
   * Does NOT delete database rows. Instead it marks the clinic's lastResetAt
   * to the start of the current day so subsequent queries and enqueue operations
   * will only consider entries created after that timestamp. Also clears
   * in-memory running/paused flags and persists cleared clinic states.
   */
  @Scheduled(cron = "0 0 0 * * *")
  @Transactional
  public void resetQueuesAtMidnight() {
    LocalDate today = LocalDate.now();
    LocalDateTime from = today.atStartOfDay();
    try {
      // clear in-memory control flags
      running.clear();
      paused.clear();

      // persist cleared clinic states (set running=false, paused=false, lastResetAt=from)
      try {
        var states = stateRepo.findAll();
        for (ClinicQueueState s : states) {
          s.setRunning(false);
          s.setPaused(false);
          s.setLastResetAt(from);
          s.setLastUpdated(LocalDateTime.now());
        }
        stateRepo.saveAll(states);
      } catch (Exception ignored) {}

      System.out.println("[QueueService] Midnight reset executed, lastResetAt set to: " + from);
    } catch (Exception e) {
      System.err.println("[QueueService] Midnight reset failed: " + e.getMessage());
    }
  }
}

