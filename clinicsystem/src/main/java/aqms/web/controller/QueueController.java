package aqms.web.controller;

import aqms.domain.model.QueueEntry;
import aqms.domain.model.UserAccount;
import aqms.domain.model.AppointmentSlot;
import aqms.domain.enums.AppointmentStatus;
import aqms.repository.UserAccountRepository;
import aqms.repository.AppointmentSlotRepository;
import aqms.service.QueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class QueueController {
  private final QueueService queueService;
  private final UserAccountRepository userRepo;
  private final AppointmentSlotRepository slotRepo;

  // Staff endpoints
  @PostMapping("/queue/start")
  @PreAuthorize("hasRole('STAFF')")
  public ResponseEntity<Void> startQueue(@RequestBody ClinicRequest req) {
    queueService.startQueue(req.clinicId());
    return ResponseEntity.ok().build();
  }

  @PostMapping("/queue/pause")
  @PreAuthorize("hasRole('STAFF')")
  public ResponseEntity<Void> pauseQueue(@RequestBody ClinicRequest req) {
    queueService.pauseQueue(req.clinicId());
    return ResponseEntity.ok().build();
  }

  @PostMapping("/queue/resume")
  @PreAuthorize("hasRole('STAFF')")
  public ResponseEntity<Void> resumeQueue(@RequestBody ClinicRequest req) {
    queueService.resumeQueue(req.clinicId());
    return ResponseEntity.ok().build();
  }

  @PostMapping("/queue/call-next")
  @PreAuthorize("hasRole('STAFF')")
  public QueueEntry callNext(@RequestBody ClinicRequest req) {
    return queueService.callNext(req.clinicId());
  }

  @PostMapping("/queue/fast-track")
  @PreAuthorize("hasRole('STAFF')")
  public QueueEntry fastTrack(@RequestBody FastTrackRequest req) {
    return queueService.fastTrack(req.appointmentId(), req.reason());
  }

  @GetMapping("/queue/status")
  @PreAuthorize("hasRole('STAFF')")
  public org.springframework.http.ResponseEntity<?> getQueueStatus(@RequestParam String clinicId, @RequestParam(required = false, defaultValue = "false") boolean all, @RequestParam(required = false) String date) {
    Long cid;
    try {
      cid = Long.valueOf(clinicId);
    } catch (NumberFormatException e) {
      return org.springframework.http.ResponseEntity.badRequest()
          .body(java.util.Map.of("error", "Invalid clinicId", "value", clinicId));
    }
    List<?> list;
    if (all) {
      // return all entries for debugging (no date filter)
      list = queueService.getAllQueueStatusView(cid);
    } else if (date != null && !date.isBlank()) {
      // parse date (expect ISO yyyy-MM-dd) and use date-aware view
      java.time.LocalDate d;
      try {
        d = java.time.LocalDate.parse(date);
      } catch (java.time.format.DateTimeParseException ex) {
        return org.springframework.http.ResponseEntity.badRequest()
            .body(java.util.Map.of("error", "Invalid date format, expected yyyy-MM-dd", "value", date));
      }
      list = queueService.getQueueStatusView(cid, d);
    } else {
      list = queueService.getQueueStatusView(cid);
    }
    var body = java.util.Map.of(
      "entries", list,
      "queueStarted", queueService.isRunning(cid),
      "queuePaused", queueService.isPaused(cid)
    );
    return org.springframework.http.ResponseEntity.ok(body);
  }

  

  // Patient endpoints
  @GetMapping("/patient/queue")
  @PreAuthorize("hasRole('PATIENT')")
  public PatientQueueResponse getPatientQueueByAppointment(@RequestParam Long appointmentId) {
    var slotOpt = slotRepo.findById(appointmentId);
    if (slotOpt.isEmpty()) return new PatientQueueResponse(null, false, null, 0, 0, false);
    var slot = slotOpt.get();

    var opt = queueService.findBySlotId(slot.getId());
    // If there's no queue entry yet but the slot is already CHECKED_IN, allow the patient to
    // create an entry for themselves (this covers cases where staff checked in but enqueue
    // wasn't persisted for some reason).
    if (opt.isEmpty()) {
      try {
        if (slot.getStatus() == AppointmentStatus.CHECKED_IN) {
          var created = queueService.enqueue(slot.getId());
          // compute summary
          var list = queueService.getQueueStatusView(created.getClinicId());
          int total = (int) list.stream().filter(e -> e.status() == aqms.domain.enums.QueueStatus.QUEUED || e.status() == aqms.domain.enums.QueueStatus.CALLED).count();
      // Use the highest called/serving queue number as "Now Serving" (most recently called)
      int currentCalled = list.stream()
        .filter(e -> e.status() == aqms.domain.enums.QueueStatus.CALLED || e.status() == aqms.domain.enums.QueueStatus.SERVING)
        .mapToInt(e -> e.queueNumber() == null ? 0 : e.queueNumber())
        .max()
        .orElse(0);
          int ahead = (int) list.stream().filter(e -> (e.status() == aqms.domain.enums.QueueStatus.QUEUED || e.status() == aqms.domain.enums.QueueStatus.CALLED) && e.queueNumber() < created.getQueueNumber()).count();
          boolean started = queueService.isRunning(created.getClinicId());
          return new PatientQueueResponse(created, started, currentCalled == 0 ? null : currentCalled, ahead, total, queueService.isPaused(created.getClinicId()));
        }
      } catch (Exception e) {
        // fall through and return empty response
        System.err.println("Failed to auto-enqueue patient request: " + e.getMessage());
      }
      return new PatientQueueResponse(null, false, null, 0, 0, false);
    }
    var entry = opt.get();
    var list = queueService.getQueueStatusView(entry.getClinicId());
    int total = (int) list.stream().filter(e -> e.status() == aqms.domain.enums.QueueStatus.QUEUED || e.status() == aqms.domain.enums.QueueStatus.CALLED).count();
    // Use the highest called/serving queue number as "Now Serving"
    int currentCalled = list.stream()
        .filter(e -> e.status() == aqms.domain.enums.QueueStatus.CALLED || e.status() == aqms.domain.enums.QueueStatus.SERVING)
        .mapToInt(e -> e.queueNumber() == null ? 0 : e.queueNumber())
        .max()
        .orElse(0);
    // If this patient's own entry is CALLED or SERVING, prefer their number explicitly
    if (entry != null && (entry.getStatus() == aqms.domain.enums.QueueStatus.CALLED || entry.getStatus() == aqms.domain.enums.QueueStatus.SERVING)) {
      currentCalled = entry.getQueueNumber() == null ? currentCalled : entry.getQueueNumber();
    }
  int ahead = (int) list.stream().filter(e -> (e.status() == aqms.domain.enums.QueueStatus.QUEUED || e.status() == aqms.domain.enums.QueueStatus.CALLED) && e.queueNumber() < entry.getQueueNumber()).count();
    boolean started = queueService.isRunning(entry.getClinicId());
    return new PatientQueueResponse(entry, started, currentCalled == 0 ? null : currentCalled, ahead, total, queueService.isPaused(entry.getClinicId()));
  }

  @GetMapping("/patient/queue/mine")
  @PreAuthorize("hasRole('PATIENT')")
  public PatientQueueResponse getPatientQueueMine() {
    var email = SecurityContextHolder.getContext().getAuthentication().getName();
    UserAccount u = userRepo.findByEmail(email).orElseThrow();
    var slots = slotRepo.findByPatientIdOrderByStartTimeAsc(u.getId());
    if (slots.isEmpty()) return new PatientQueueResponse(null, false, null, 0, 0, false);
    // assume first upcoming slot
    var slot = slots.get(0);
    var opt = queueService.findBySlotId(slot.getId());
    if (opt.isEmpty()) return new PatientQueueResponse(null, false, null, 0, 0, false);
    var entry = opt.get();
    var list = queueService.getQueueStatusView(entry.getClinicId());
    int total = (int) list.stream().filter(e -> e.status() == aqms.domain.enums.QueueStatus.QUEUED || e.status() == aqms.domain.enums.QueueStatus.CALLED).count();
    // Use the highest called/serving queue number as "Now Serving"
    int currentCalled = list.stream()
        .filter(e -> e.status() == aqms.domain.enums.QueueStatus.CALLED || e.status() == aqms.domain.enums.QueueStatus.SERVING)
        .mapToInt(e -> e.queueNumber() == null ? 0 : e.queueNumber())
        .max()
        .orElse(0);
    // If this patient's own entry is CALLED or SERVING, prefer their number explicitly
    if (entry != null && (entry.getStatus() == aqms.domain.enums.QueueStatus.CALLED || entry.getStatus() == aqms.domain.enums.QueueStatus.SERVING)) {
      currentCalled = entry.getQueueNumber() == null ? currentCalled : entry.getQueueNumber();
    }
    int ahead = (int) list.stream().filter(e -> e.status() == aqms.domain.enums.QueueStatus.QUEUED && e.queueNumber() < entry.getQueueNumber()).count();
    boolean started = queueService.isRunning(entry.getClinicId());
    return new PatientQueueResponse(entry, started, currentCalled == 0 ? null : currentCalled, ahead, total, queueService.isPaused(entry.getClinicId()));
  }

  record ClinicRequest(Long clinicId) {}
  record FastTrackRequest(Long appointmentId, String reason) {}

  // Response for patient-facing queue info
  public static record PatientQueueResponse(QueueEntry entry, boolean queueStarted, Integer currentCalledNumber, int peopleAhead, int totalInQueue, boolean queuePaused) {}
}

