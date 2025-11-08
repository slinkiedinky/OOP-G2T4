// temporary appointment slots seed data for Clinic 22 ONLY for testing of patient endpoints

// will eventually need to: 
// 1. link to the sysadmin configurations -> create appt slots based on sysadmin configurations 
// 2. set up frontend for sysadmin configurations
// 3. seed NEW appointment slot data into clinics based on linked sysadmin configurations 

package aqms.web.controller;

import aqms.domain.enums.AppointmentStatus;
import aqms.domain.model.*;
import aqms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/seed")
@RequiredArgsConstructor
@PreAuthorize("permitAll()")
public class SeedController {
    
    private final AppointmentSlotRepository slotRepo;
    private final ClinicRepository clinicRepo;
    private final DoctorRepository doctorRepo;
    private final UserAccountRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/appointment-slots")
    public String seedAppointmentSlots() {
    // Use clinic ID 22 which has doctors
    Clinic clinic = clinicRepo.findById(22L)
        .orElseThrow(() -> new RuntimeException("Clinic 22 not found"));
        List<Doctor> doctors = doctorRepo.findByClinicId(clinic.getId());
        if (doctors.isEmpty()) {
            return "No doctors found in clinic " + clinic.getId();
        }
        
        Doctor doctor = doctors.get(0);
        
        // Create slots for the next 7 days
        List<AppointmentSlot> slots = new ArrayList<>();
        LocalDate today = LocalDate.now();
        
        for (int day = 0; day < 7; day++) {
            LocalDate date = today.plusDays(day);
            
            // Create slots from 9 AM to 5 PM, every 30 minutes
            for (int hour = 9; hour < 17; hour++) {
                for (int minute = 0; minute < 60; minute += 30) {
                    LocalDateTime startTime = LocalDateTime.of(date, LocalTime.of(hour, minute));
                    LocalDateTime endTime = startTime.plusMinutes(30);
                    
                    AppointmentSlot slot = new AppointmentSlot();
                    slot.setClinic(clinic);
                    slot.setDoctor(doctor);
                    slot.setStartTime(startTime);
                    slot.setEndTime(endTime);
                    slot.setStatus(AppointmentStatus.AVAILABLE);
                    
                    slots.add(slot);
                }
            }
        }
        
        slotRepo.saveAll(slots);
        
        return "Created " + slots.size() + " appointment slots for clinic " + 
               clinic.getId() + " (" + clinic.getName() + ") and doctor " + 
               doctor.getId() + " (" + doctor.getName() + ")";
    }

    @PostMapping("/reset-admin-password")
    public String resetAdminPassword(@RequestParam(defaultValue = "hy5411@gmail.com") String email, 
                                     @RequestParam(defaultValue = "12345") String password) {
        var user = userRepo.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Email " + email + " not found"));
        
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setEnabled(true);
        userRepo.save(user);
        
        return "Password reset for user " + email + " to: " + password;
    }
}