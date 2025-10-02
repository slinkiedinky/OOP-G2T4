package aqms.web.controller;

import aqms.domain.model.AppointmentSlot;
import aqms.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
}