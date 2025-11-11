package aqms.web.controller;

import aqms.domain.enums.UserRole;
import aqms.domain.enums.AppointmentStatus;
import aqms.domain.model.AppointmentSlot;
import aqms.domain.model.UserAccount;
import aqms.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import aqms.repository.UserAccountRepository;
import aqms.repository.AppointmentSlotRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasRole('STAFF')")
@RequiredArgsConstructor
/**
 * ClinicStaffController
 *
 * Exposes staff-only endpoints under /api/staff for managing appointments and patients.
 * Responsibilities include listing/updating appointments, checking in patients, booking
 * appointments on behalf of patients, and registering patients (staff flow).
 */
public class ClinicStaffController {

    private final AppointmentSlotRepository slotRepo;
    private final AppointmentService appointmentService;
    private final UserAccountRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final aqms.service.QueueService queueService;

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

    @GetMapping("/slots/available")
    public List<AppointmentSlot> getAvailableSlots(
            @RequestParam Long clinicId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long doctorId) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        
        if (doctorId != null) {
            // Get available slots for specific doctor
            return slotRepo.findAvailableByClinicDateAndDoctor(clinicId, startOfDay, endOfDay, doctorId);
        } else {
            // Get all available slots for clinic
            return slotRepo.findAvailableByClinicAndDate(clinicId, startOfDay, endOfDay);
        }
    }
    // Check in patient
    @PostMapping("/appointments/{apptId}/check-in")
    public AppointmentSlot checkInPatient(@PathVariable Long apptId) {
                var slot = appointmentService.checkIn(apptId);
                // enqueue into clinic queue for staff/live display
                try {
                    queueService.enqueue(slot.getId());
                } catch (Exception e) {
                    // don't fail the check-in if queue enqueue fails
                    System.err.println("Failed to enqueue after check-in: " + e.getMessage());
                }
                return slot;
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
        return appointmentService.checkIn(apptId);
    }

    // Add treatment summary
    @PutMapping("/appointments/{apptId}/treatment-summary")
    public AppointmentSlot addTreatmentSummary(
            @PathVariable Long apptId,
            @RequestBody String treatmentSummary) {
        return appointmentService.addTreatmentSummary(apptId, treatmentSummary);
    }

    // Mark as completed (optional force param for retroactive completion)
    @PutMapping("/appointments/{apptId}/complete")
    public AppointmentSlot markCompleted(@PathVariable Long apptId, @RequestParam(name = "force", required = false, defaultValue = "false") boolean force) {
        return appointmentService.markCompleted(apptId, force);
    }

    // Mark as no-show
    @PutMapping("/appointments/{apptId}/no-show")
    public AppointmentSlot markNoShow(@PathVariable Long apptId) {
        return appointmentService.markNoShow(apptId);
    }

    // Get all patients
    @GetMapping("/patients")
    public List<UserAccount> getAllPatients() {
        return userRepo.findByRole(UserRole.PATIENT);
    }

    // Book appointment for walk-in patient (staff version)
    @PostMapping("/appointments/book")
    public AppointmentSlot bookAppointmentForPatient(@RequestBody BookAppointmentRequest request) {
        return appointmentService.book(request.slotId(), request.patientId());
    }

    record BookAppointmentRequest(Long slotId, Long patientId) {}

    // Register new patient (staff can create patient accounts)
    @PostMapping("/patients/register")
    public UserAccount registerPatient(@RequestBody RegisterPatientRequest request) {
        // Validate that name is provided for patients
        if (request.name() == null || request.name().trim().isEmpty()) {
            throw new IllegalArgumentException("Patient name is required");
        }
        
        var patient = new UserAccount();
        patient.setFullname(request.name());
        patient.setEmail(request.email());
        patient.setPasswordHash(passwordEncoder.encode("defaultpassword123"));
        patient.setRole(UserRole.PATIENT);
        patient.setEnabled(true);
        return userRepo.save(patient);
    }

    record RegisterPatientRequest(String name, String email) {}
}