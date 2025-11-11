package aqms.web.controller;
// Appointment endpoints:
// - Get all scheduled appointments: GET /api/patient/appointments
// - Get specific appointment: GET /api/patient/appointments/{id}
// - Get appointment history: GET /api/patient/appointments/history
// - Update appointment datetime: PUT /api/patient/appointments/{id}/datetime
// - Cancel appointment: DELETE /api/patient/appointments/{id}
// - Check reschedule eligibility: GET /api/patient/appointments/{id}/can-reschedule

// Clinic endpoints:
import aqms.domain.model.AppointmentSlot;
import aqms.domain.model.Clinic;
import aqms.domain.model.Doctor;
import aqms.service.AppointmentService;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import aqms.repository.ClinicRepository;
import aqms.repository.DoctorRepository;

@RestController
@RequestMapping("/api/patient")
@PreAuthorize("hasRole('PATIENT')")
@RequiredArgsConstructor
/**
 * PatientController
 *
 * Patient-facing endpoints for viewing and booking appointments, viewing
 * clinics and doctors, and accessing appointment history.
 */
public class PatientController {

    private final AppointmentService appointmentService;
    private final ClinicRepository clinicRepository;
    private final DoctorRepository doctorRepository;

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

        // Get available appointment slots
    @GetMapping("/appointments/available")
    public List<AppointmentSlot> getAvailableAppointments(
            @RequestParam Long clinicId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return appointmentService.findAvailable(clinicId, doctorId, date);
    }

    // Book appointment slot
    @PostMapping("/appointments/book")
    public AppointmentSlot bookAppointment(@RequestBody BookAppointmentRequest request) {
        return appointmentService.book(request.slotId(), request.patientId());
    }
    record BookAppointmentRequest(Long slotId, Long patientId) {}

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
    
    // Clinic endpoints
    // Get all clinics
    @GetMapping("/clinics")
    public List<Clinic> getAllClinics() {
        return clinicRepository.findAll();
    }

    // Get specific clinic
    @GetMapping("/clinics/{clinicId}")
    public Clinic getClinic(@PathVariable Long clinicId) {
        return clinicRepository.findById(clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Clinic not found"));
    }

    // Get all doctors in a clinic
    @GetMapping("/clinics/{clinicId}/doctors") 
    public List<Doctor> getAllDoctors(@PathVariable Long clinicId) { 
        return doctorRepository.findByClinicId(clinicId); 
    }

    // Get specific doctor
    @GetMapping("/doctors/{doctorId}")
    public Doctor getDoctor(@PathVariable Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
    }
}