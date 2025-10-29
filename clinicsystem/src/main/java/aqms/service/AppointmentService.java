package aqms.service;

import aqms.config.AppProperties;
import aqms.domain.enums.AppointmentStatus;
import aqms.domain.model.*;
import aqms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import aqms.domain.enums.UserRole;

@Service @RequiredArgsConstructor
public class AppointmentService {
  private final AppointmentSlotRepository slotRepo;
  private final AppointmentHistoryRepository histRepo;
  private final UserAccountRepository userRepo;
  private final AppProperties props;

  @Transactional
  public AppointmentSlot book(Long slotId, Long patientId) {
    var slot = slotRepo.findById(slotId).orElseThrow();
    if (slot.getStatus() != AppointmentStatus.AVAILABLE) throw new IllegalStateException("Slot not available");
    // Fetch the UserAccount and verify it's a PATIENT
    var user = userRepo.findById(patientId)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    
    if (user.getRole() != UserRole.PATIENT) {
      throw new IllegalArgumentException("User must be a PATIENT");
    }
    
    slot.setPatient(user);
    slot.setStatus(AppointmentStatus.BOOKED);
    slotRepo.save(slot);
    addHistory(slot, "BOOKED", "PATIENT", "Booked by patient " + patientId);
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
    slot.setStartTime(newStart); slot.setEndTime(newEnd);
    slotRepo.save(slot);
    addHistory(slot, "RESCHEDULED", "PATIENT", "Rescheduled");
    return slot;
  }

  @Transactional
  public void cancel(Long slotId) {
    var slot = slotRepo.findById(slotId).orElseThrow();
    ensureChangeAllowed(slot.getStartTime());
    slot.setStatus(AppointmentStatus.CANCELLED);
    slot.setPatient(null);
    slotRepo.save(slot);
    addHistory(slot, "CANCELLED", "PATIENT", "Cancelled by patient");
  }

  @Transactional
  public AppointmentSlot checkIn(Long slotId) {
    var slot = slotRepo.findById(slotId).orElseThrow();
    slot.setStatus(AppointmentStatus.CHECKED_IN);
    slotRepo.save(slot);
    addHistory(slot, "CHECKED_IN", "STAFF", "Checked in");
    return slot;
  }

  private void ensureChangeAllowed(LocalDateTime start) {
    var cutoff = start.minusHours(props.getRules().getMinAdvanceHoursForChange());
    if (LocalDateTime.now().isAfter(cutoff)) {
      throw new IllegalStateException("Changes allowed only ≥ " + props.getRules().getMinAdvanceHoursForChange() + " hours before.");
    }
  }

  private void addHistory(AppointmentSlot s, String action, String actor, String details) {
    var h = new AppointmentHistory(); h.setSlot(s); h.setAction(action); h.setActor(actor); h.setDetails(details);
    histRepo.save(h);
  }

  @Transactional(readOnly = true)
  public List<AppointmentSlot> getAllScheduledAppointments(Long patientId) {
      return slotRepo.findByPatientIdOrderByStartTimeAsc(patientId);
  }

  @Transactional(readOnly = true)
  public AppointmentSlot getScheduledAppointment(Long apptId, Long patientId) {
      var slot = slotRepo.findById(apptId)
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
  public AppointmentSlot updateAppointmentDatetime(Long apptId, Long patientId, LocalDateTime newStart, LocalDateTime newEnd) {
      var slot = slotRepo.findById(apptId)
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
      var slot = slotRepo.findById(apptId)
              .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
      
      if (!slot.getPatient().getId().equals(patientId)) {
          throw new IllegalStateException("Appointment does not belong to this patient");
      }
      
      ensureChangeAllowed(slot.getStartTime());
      
      slot.setStatus(AppointmentStatus.CANCELLED);
      slot.setPatient(null);
      slotRepo.save(slot);
      addHistory(slot, "CANCELLED", "PATIENT", "Cancelled by patient");
  }

  @Transactional(readOnly = true)
  public boolean checkReschedule(Long apptId, Long patientId) {
      var slot = slotRepo.findById(apptId)
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
  
  if (slot.getStatus() != AppointmentStatus.CHECKED_IN && slot.getStatus() != AppointmentStatus.COMPLETED) {
    throw new IllegalStateException("Can only add treatment summary after patient is checked in");
  }
  
  slot.setTreatmentSummary(treatmentSummary);
  slotRepo.save(slot);
  addHistory(slot, "TREATMENT_SUMMARY_ADDED", "STAFF", "Treatment summary added");
  return slot;
}

@Transactional
public AppointmentSlot markCompleted(Long slotId) {
  var slot = slotRepo.findById(slotId).orElseThrow();
  
  if (slot.getStatus() != AppointmentStatus.CHECKED_IN) {
    throw new IllegalStateException("Can only mark as completed after check-in");
  }
  
  if (slot.getTreatmentSummary() == null || slot.getTreatmentSummary().isEmpty()) {
    throw new IllegalStateException("Must add treatment summary before marking as completed");
  }
  
  slot.setStatus(AppointmentStatus.COMPLETED);
  slotRepo.save(slot);
  addHistory(slot, "COMPLETED", "STAFF", "Appointment completed");
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
}
