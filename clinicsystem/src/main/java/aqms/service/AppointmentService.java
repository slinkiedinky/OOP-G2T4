package aqms.service;

import aqms.config.AppProperties;
import aqms.domain.enums.AppointmentStatus;
import aqms.domain.enums.QueueStatus;
import aqms.domain.enums.UserRole;
import aqms.domain.model.*;
import aqms.repository.*;
import java.time.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppointmentService {
  /**
   * AppointmentService
   *
   * Core appointment operations: booking, rescheduling, cancelling, check-in, and querying
   * appointment slots for patients and staff. Persists an appointment history for audit.
   */
  private final AppointmentSlotRepository slotRepo;

  private final AppointmentHistoryRepository histRepo;
  private final UserAccountRepository userRepo;
  private final AppProperties props;
  private final QueueEntryRepository queueEntryRepo;
  private final PasswordResetService passwordResetService;

  @Transactional
  public AppointmentSlot book(Long slotId, Long patientId) {
    var slot = slotRepo.findById(slotId).orElseThrow();
    if (slot.getStatus() != AppointmentStatus.AVAILABLE)
      throw new IllegalStateException("Slot not available");
    // Fetch the UserAccount and verify it's a PATIENT
    var user =
        userRepo
            .findById(patientId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (user.getRole() != UserRole.PATIENT) {
      throw new IllegalArgumentException("User must be a PATIENT");
    }

    slot.setPatient(user);
    slot.setStatus(AppointmentStatus.BOOKED);
    slotRepo.save(slot);
    addHistory(slot, "BOOKED", "PATIENT", "Booked by patient " + patientId);

    passwordResetService.sendNewAccountReset(user.getEmail());
    return slot;
  }

  @Transactional(readOnly = true)
  public List<AppointmentSlot> findAvailable(Long clinicId, Long doctorId, LocalDate on) {
    LocalDateTime startOfDay = on.atStartOfDay();
    LocalDateTime endOfDay = on.plusDays(1).atStartOfDay();
    return slotRepo.findAvailable(clinicId, doctorId, startOfDay, endOfDay);
  }

  @Transactional
  public AppointmentSlot reschedule(Long slotId, LocalDateTime newStart, LocalDateTime newEnd) {
    var slot = slotRepo.findById(slotId).orElseThrow();
    ensureChangeAllowed(slot.getStartTime());
    slot.setStartTime(newStart);
    slot.setEndTime(newEnd);
    slotRepo.save(slot);
    addHistory(slot, "RESCHEDULED", "PATIENT", "Rescheduled");
    return slot;
  }

  @Transactional
  public void cancel(Long slotId, boolean isByStaff) {
    var slot = slotRepo.findById(slotId).orElseThrow();

    // Only check time restriction if patient is cancelling
    if (!isByStaff) {
      ensureChangeAllowed(slot.getStartTime());
    }

    slot.setStatus(AppointmentStatus.AVAILABLE);
    slot.setPatient(null);
    slotRepo.save(slot);

    String actor = isByStaff ? "STAFF" : "PATIENT";
    String details =
        isByStaff
            ? "Cancelled by staff - slot now available"
            : "Cancelled by patient - slot now available";
    addHistory(slot, "CANCELLED", actor, details);
  }

  @Transactional
  public AppointmentSlot checkIn(Long slotId) {
    var slot = slotRepo.findById(slotId).orElseThrow();
    var patient = slot.getPatient();
    ;
    slot.setPatient(patient);
    slot.setStatus(AppointmentStatus.CHECKED_IN);
    slotRepo.save(slot);
    addHistory(slot, "CHECKED_IN", "STAFF", "Checked in");
    return slot;
  }

  private void ensureChangeAllowed(LocalDateTime start) {
    var cutoff = start.minusHours(props.getRules().getMinAdvanceHoursForChange());
    if (LocalDateTime.now().isAfter(cutoff)) {
      throw new IllegalStateException(
          "Changes allowed only ≥ "
              + props.getRules().getMinAdvanceHoursForChange()
              + " hours before.");
    }
  }

  private void addHistory(AppointmentSlot s, String action, String actor, String details) {
    var h = new AppointmentHistory();
    h.setSlot(s);
    h.setAction(action);
    h.setActor(actor);
    h.setDetails(details);
    histRepo.save(h);
  }

  @Transactional(readOnly = true)
  public List<AppointmentSlot> getAllScheduledAppointments(Long patientId) {
    return slotRepo.findByPatientIdOrderByStartTimeAsc(patientId);
  }

  @Transactional(readOnly = true)
  public AppointmentSlot getScheduledAppointment(Long apptId, Long patientId) {
    var slot =
        slotRepo
            .findById(apptId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

    if (!slot.getPatient().getId().equals(patientId)) {
      throw new IllegalStateException("Appointment does not belong to this patient");
    }

    return slot;
  }

  @Transactional(readOnly = true)
  public List<AppointmentSlot> getAppointmentHistory(Long patientId) {
    // Get all appointments (both current and past)
    return slotRepo.findByPatientIdOrderByStartTimeAsc(patientId);
  }

  @Transactional
  public AppointmentSlot updateAppointmentDatetime(
      Long apptId, Long patientId, LocalDateTime newStart, LocalDateTime newEnd) {
    var slot =
        slotRepo
            .findById(apptId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

    if (!slot.getPatient().getId().equals(patientId)) {
      throw new IllegalStateException("Appointment does not belong to this patient");
    }

    ensureChangeAllowed(slot.getStartTime());

    slot.setStartTime(newStart);
    slot.setEndTime(newEnd);
    slotRepo.save(slot);
    addHistory(slot, "RESCHEDULED", "PATIENT", "Rescheduled to " + newStart);
    return slot;
  }

  @Transactional
  public void cancelAppointment(Long apptId, Long patientId) {
    var slot =
        slotRepo
            .findById(apptId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

    if (!slot.getPatient().getId().equals(patientId)) {
      throw new IllegalStateException("Appointment does not belong to this patient");
    }

    cancel(apptId, false); // Call the unified method with isByStaff=false
  }

  @Transactional(readOnly = true)
  public boolean checkReschedule(Long apptId, Long patientId) {
    var slot =
        slotRepo
            .findById(apptId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

    if (!slot.getPatient().getId().equals(patientId)) {
      return false;
    }

    var cutoff = slot.getStartTime().minusHours(props.getRules().getMinAdvanceHoursForChange());
    return LocalDateTime.now().isBefore(cutoff);
  }

  @Transactional
  public AppointmentSlot addTreatmentSummary(Long slotId, String treatmentSummary) {
    var slot = slotRepo.findById(slotId).orElseThrow();
    // Require that the patient has been called in the queue before adding treatment summary
    var qOpt = queueEntryRepo.findBySlotId(slot.getId());
    if (qOpt.isEmpty() || qOpt.get().getStatus() != QueueStatus.CALLED) {
      throw new IllegalStateException(
          "Patient must be called from the queue before adding a treatment summary");
    }

    slot.setTreatmentSummary(treatmentSummary);
    slotRepo.save(slot);
    addHistory(slot, "TREATMENT_SUMMARY_ADDED", "STAFF", "Treatment summary added");
    return slot;
  }

  @Transactional
  public AppointmentSlot markCompleted(Long slotId) {
    return markCompleted(slotId, false);
  }

  @Transactional
  public AppointmentSlot markCompleted(Long slotId, boolean force) {
    var slot = slotRepo.findById(slotId).orElseThrow();

    // Only allow completion if patient was called and treatment summary present
    var qOpt = queueEntryRepo.findBySlotId(slot.getId());
    if (!force) {
      if (qOpt.isEmpty() || qOpt.get().getStatus() != QueueStatus.CALLED) {
        throw new IllegalStateException(
            "Patient must be called from the queue before marking appointment as completed");
      }

      if (slot.getTreatmentSummary() == null || slot.getTreatmentSummary().isEmpty()) {
        throw new IllegalStateException("Must add treatment summary before marking as completed");
      }
    } else {
      // forced completion: if no treatment summary, add a note indicating forced completion
      if (slot.getTreatmentSummary() == null || slot.getTreatmentSummary().isEmpty()) {
        slot.setTreatmentSummary("(forced completion by staff)");
      }
    }

    slot.setStatus(AppointmentStatus.COMPLETED);
    slotRepo.save(slot);
    addHistory(
        slot,
        "COMPLETED",
        "STAFF",
        force ? "Appointment completed (forced)" : "Appointment completed");
    // If there's a queue entry for this slot, mark it completed as well
    try {
      qOpt.ifPresent(
          entry -> {
            entry.setStatus(QueueStatus.COMPLETED);
            queueEntryRepo.save(entry);
          });
    } catch (Exception e) {
      // don't prevent completion if queue entry update fails
      System.err.println("Failed to update queue entry status on completion: " + e.getMessage());
    }
    return slot;
  }

  @Transactional
  public AppointmentSlot markNoShow(Long slotId) {
    var slot = slotRepo.findById(slotId).orElseThrow();

    if (slot.getStatus() != AppointmentStatus.BOOKED) {
      throw new IllegalStateException("Can only mark no-show for booked appointments");
    }

    slot.setStatus(AppointmentStatus.NO_SHOW);
    slot.setPatient(null);
    slotRepo.save(slot);
    addHistory(slot, "NO_SHOW", "STAFF", "Patient did not show up");
    return slot;
  }

  @Scheduled(fixedRate = 1800000) // every 30 minutes
  @Transactional
  public void autoMarkNoShowForOverdueAppointments() {
    LocalDateTime now = LocalDateTime.now();

    System.out.println("=== NO-SHOW SCHEDULER RUNNING at " + now + " ===");

    // Find all appoints still in BOOKED status, regardless of start/end date
    List<AppointmentSlot> allBooked = slotRepo.findByStatus(AppointmentStatus.BOOKED);

    System.out.println("Found " + allBooked.size() + " currently BOOKED appointments.");

    int markedCount = 0;
    for (AppointmentSlot slot : allBooked) {
      // Only process those where endTime already passed
      if (slot.getEndTime() != null && slot.getEndTime().isBefore(now)) {
        System.out.println("  Overdue BOOKED: ID=" + slot.getId() + ", End=" + slot.getEndTime());
        slot.setStatus(AppointmentStatus.NO_SHOW);
        slot.setPatient(null);
        slotRepo.save(slot);
        addHistory(
            slot, "NO_SHOW", "SYSTEM", "Automatically marked as no-show (appointment time passed)");
        markedCount++;
      }
    }
    System.out.println("✓ Auto-marked " + markedCount + " overdue appointments as NO_SHOW");
    System.out.println("=== NO-SHOW SCHEDULER FINISHED ===");
  }
}
