package aqms.web.controller;

import aqms.domain.model.AppointmentSlot;
import aqms.repository.AppointmentSlotRepository;
import aqms.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasRole('STAFF')")
@RequiredArgsConstructor
public class ClinicStaffController {

    private final AppointmentSlotRepository slotRepo;
    private final AppointmentService appointmentService;

    // Get all upcoming appointments filtered by clinic
    @GetMapping("/appointments/upcoming")
    public List<AppointmentSlot> getAllUpcomingAppointments(@RequestParam Long clinicId) {
        return slotRepo.findUpcomingByClinic(clinicId, LocalDateTime.now());
    }

    // Get all upcoming appointments filtered by clinic and date
    @GetMapping("/appointments/upcoming/by-date")
    public List<AppointmentSlot> getAllUpcomingAppointmentsByDate(
            @RequestParam Long clinicId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        return slotRepo.findUpcomingByClinicAndDate(clinicId, startOfDay, endOfDay);
    }

    // Get all upcoming appointments filtered by clinic, date, and doctor
    @GetMapping("/appointments/upcoming/by-doctor")
    public List<AppointmentSlot> getAllUpcomingAppointmentsByDoctor(
            @RequestParam Long clinicId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Long doctorId) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        return slotRepo.findUpcomingByClinicDateAndDoctor(clinicId, startOfDay, endOfDay, doctorId);
    }

    // Get specific appointment details
    @GetMapping("/appointments/{apptId}")
    public AppointmentSlot getAppointment(@PathVariable Long apptId) {
        return slotRepo.findById(apptId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
    }

    // Check in patient
    @PostMapping("/appointments/{apptId}/check-in")
    public AppointmentSlot checkInPatient(@PathVariable Long apptId) {
        return appointmentService.checkIn(apptId);
    }

    // Cancel appointment (staff version - no patient validation needed)
    @DeleteMapping("/appointments/{apptId}/cancel")
    public void cancelAppointment(@PathVariable Long apptId) {
        appointmentService.cancel(apptId);
    }

    // Reschedule appointment (staff version)
    @PutMapping("/appointments/{apptId}/reschedule")
    public AppointmentSlot rescheduleAppointment(
            @PathVariable Long apptId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newStartTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newEndTime) {
        return appointmentService.reschedule(apptId, newStartTime, newEndTime);
    }

    // Update appointment status
    @PutMapping("/appointments/{apptId}/status")
    public AppointmentSlot updateAppointmentStatus(
            @PathVariable Long apptId,
            @RequestParam Long patientId) {
        // This updates the appointment by changing status to "checked in"
        return appointmentService.checkIn(apptId);
    }
}