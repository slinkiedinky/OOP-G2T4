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

@Service @RequiredArgsConstructor
public class AppointmentService {
  private final AppointmentSlotRepository slotRepo;
  private final AppointmentHistoryRepository histRepo;
  private final AppProperties props;

  @Transactional
  public AppointmentSlot book(Long slotId, Long patientId) {
    var slot = slotRepo.findById(slotId).orElseThrow();
    if (slot.getStatus() != AppointmentStatus.AVAILABLE) throw new IllegalStateException("Slot not available");
    var p = new Patient(); p.setId(patientId);
    slot.setPatient(p); slot.setStatus(AppointmentStatus.BOOKED);
    slotRepo.save(slot);
    addHistory(slot, "BOOKED", "PATIENT", "Booked by patient " + patientId);
    return slot;
  }

  @Transactional(readOnly = true)
  public List<AppointmentSlot> findAvailable(Long clinicId, Long doctorId, LocalDate on) {
    return slotRepo.findAvailable(clinicId, doctorId, on.atStartOfDay());
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
}
