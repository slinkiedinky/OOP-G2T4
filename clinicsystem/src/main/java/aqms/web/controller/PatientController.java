package aqms.web.controller;

// - Created PatientController with endpoints for viewing appointments
// - Get all scheduled appointments: GET /api/patient/appointments
// - Get specific appointment: GET /api/patient/appointments/{id}
// - Get appointment history: GET /api/patient/appointments/history
// - Update appointment datetime: PUT /api/patient/appointments/{id}/datetime
// - Cancel appointment: DELETE /api/patient/appointments/{id}
// - Check reschedule eligibility: GET /api/patient/appointments/{id}/can-reschedule

import aqms.domain.model.AppointmentSlot;
import aqms.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/patient")
@PreAuthorize("hasRole('PATIENT')")
@RequiredArgsConstructor
public class PatientController {

    private final AppointmentService appointmentService;

    // Get all scheduled appointments for a patient
    @GetMapping("/appointments")
    public List<AppointmentSlot> getAllScheduledAppointments(@RequestParam Long patientId) {
        return appointmentService.getAllScheduledAppointments(patientId);
    }

    // Get specific appointment details
    @GetMapping("/appointments/{apptId}")
    public AppointmentSlot getScheduledAppointment(
            @PathVariable Long apptId,
            @RequestParam Long patientId) {
        return appointmentService.getScheduledAppointment(apptId, patientId);
    }

    // Get appointment history for a patient
    @GetMapping("/appointments/history")
    public List<AppointmentSlot> getAppointmentHistory(@RequestParam Long patientId) {
        return appointmentService.getAppointmentHistory(patientId);
    }

    // Update appointment datetime (reschedule)
    @PutMapping("/appointments/{apptId}/datetime")
    public AppointmentSlot updateAppointmentDatetime(
            @PathVariable Long apptId,
            @RequestParam Long patientId,
            @RequestParam LocalDateTime startTime,
            @RequestParam LocalDateTime endTime) {
        return appointmentService.updateAppointmentDatetime(apptId, patientId, startTime, endTime);
    }

    // Cancel appointment
    @DeleteMapping("/appointments/{apptId}")
    public void cancelAppointment(
            @PathVariable Long apptId,
            @RequestParam Long patientId) {
        appointmentService.cancelAppointment(apptId, patientId);
    }

    // Check if reschedule is allowed (returns true/false)
    @GetMapping("/appointments/{apptId}/can-reschedule")
    public boolean checkReschedule(
            @PathVariable Long apptId,
            @RequestParam Long patientId) {
        return appointmentService.checkReschedule(apptId, patientId);
    }
}