package aqms.web.controller;

import aqms.repository.AppointmentSlotRepository;
import aqms.service.AppointmentService;
import aqms.web.dto.AppointmentDtos;
import java.time.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
/**
 * AppointmentController
 *
 * Public endpoints to query available slots, book/cancel/reschedule appointments and to retrieve
 * a patient's appointments.
 */
public class AppointmentController {
  private final AppointmentService svc;
  private final AppointmentSlotRepository slotRepo;

  @GetMapping("/available")
  public List<?> available(
      @RequestParam Long clinicId,
      @RequestParam(required = false) Long doctorId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    return svc.findAvailable(clinicId, doctorId, date);
  }

  @PostMapping("/book")
  public Object book(@RequestBody AppointmentDtos.BookRequest req) {
    return svc.book(req.slotId(), req.patientId());
  }

  @PutMapping("/{slotId}/reschedule")
  public Object resched(
      @PathVariable Long slotId, @RequestBody AppointmentDtos.RescheduleRequest r) {
    return svc.reschedule(slotId, r.startTime(), r.endTime());
  }

  @DeleteMapping("/{slotId}")
  public void cancel(@PathVariable Long slotId) {
    svc.cancel(slotId, false); // false = patient cancelling (with time restrictions)
  }

  @GetMapping("/patient/{patientId}")
  public List<?> myAppts(@PathVariable Long patientId) {
    return slotRepo.findByPatientIdOrderByStartTimeAsc(patientId);
  }
}
