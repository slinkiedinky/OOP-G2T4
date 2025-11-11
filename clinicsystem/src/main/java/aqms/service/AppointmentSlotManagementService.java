package aqms.service;

import aqms.domain.enums.AppointmentStatus; 
import aqms.domain.model.AppointmentSlot; 
import aqms.domain.model.Doctor;
import aqms.repository.AppointmentSlotRepository;
import aqms.repository.AppointmentHistoryRepository;
import aqms.repository.ClinicRepository; 
import aqms.repository.DoctorRepository; 
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service; 
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.*; 
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
/**
 * AppointmentSlotManagementService
 *
 * Responsibilities:
 * - Generate non-overlapping appointment slots for clinics.
 * - Create, update and delete custom slots.
 * - Enforce constraints such as doctor availability and locked slots.
 */
public class AppointmentSlotManagementService {
  private final AppointmentSlotRepository slotRepo; 
  private final AppointmentHistoryRepository historyRepo;
  private final ClinicRepository clinicRepo;
  private final DoctorRepository doctorRepo;

    @Transactional
    public List<AppointmentSlot> generateSlotsForDate(Long clinicId,
                                                      LocalDate date,
                                                      LocalTime openTime,
                                                      LocalTime closeTime,
                                                      Integer intervalMinutes,
                                                      Integer slotDurationMinutes) {
        try {
            log.info("Starting slot generation for clinic={}, date={}", clinicId, date);

            var clinic = clinicRepo.findById(clinicId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Clinic not found: " + clinicId));
            log.info("Clinic found: {}", clinic.getName());

            // Get all doctors for this clinic
            List<Doctor> allDoctors = doctorRepo.findByClinicId(clinicId);
            
            // Separate doctors by availability
            List<Doctor> morningDoctors = allDoctors.stream()
                    .filter(d -> d.getMorning() != null && d.getMorning())
                    .collect(Collectors.toList());
            
            List<Doctor> afternoonDoctors = allDoctors.stream()
                    .filter(d -> d.getAfternoon() != null && d.getAfternoon())
                    .collect(Collectors.toList());
            
            log.info("Found {} total doctors, {} morning available, {} afternoon available", 
                    allDoctors.size(), morningDoctors.size(), afternoonDoctors.size());

            // Determine if this is a morning or afternoon session
            LocalTime noon = LocalTime.of(12, 0);
            boolean isMorningSession = closeTime.isBefore(noon) || closeTime.equals(noon);
            boolean isAfternoonSession = openTime.isAfter(noon) || openTime.equals(noon);
            boolean spansBoth = openTime.isBefore(noon) && closeTime.isAfter(noon);

            // Validate doctor availability for the requested time slot
            if (isMorningSession && morningDoctors.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, 
                        "Cannot generate slots. No doctors available for morning session.");
            }
            if (isAfternoonSession && afternoonDoctors.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, 
                        "Cannot generate slots. No doctors available for afternoon session.");
            }
            if (spansBoth && (morningDoctors.isEmpty() || afternoonDoctors.isEmpty())) {
                if (morningDoctors.isEmpty()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, 
                            "Cannot generate slots. No doctors available for morning session.");
                }
                if (afternoonDoctors.isEmpty()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, 
                            "Cannot generate slots. No doctors available for afternoon session.");
                }
            }

            // Only delete slots in the specific time window, not the entire day
            LocalDateTime windowStart = LocalDateTime.of(date, openTime);
            LocalDateTime windowEnd = LocalDateTime.of(date, closeTime);

            var existingSlots = slotRepo.findByClinicIdAndStartTimeBetween(clinicId, windowStart, windowEnd);
            var lockedSlots = existingSlots.stream()
                    .filter(slot -> slot.getPatient() != null || historyRepo.existsBySlotId(slot.getId()))
                    .toList();

            if (!lockedSlots.isEmpty()) {
                log.warn("Skipping slot generation for clinic {} between {} and {}. Found {} locked slot(s) with bookings/history.",
                        clinicId, windowStart, windowEnd, lockedSlots.size());
                return List.of();
            }

            if (!existingSlots.isEmpty()) {
                log.info("Deleting {} existing slots between {} and {}", existingSlots.size(), windowStart, windowEnd);
                slotRepo.deleteAll(existingSlots);
                log.info("Deleted existing slots in time window successfully");
            } else {
                log.info("No existing slots found between {} and {}", windowStart, windowEnd);
            }

            log.info("Generating NON-OVERLAPPING slots from {} to {} with {}min duration",
                    windowStart, windowEnd, slotDurationMinutes);

            var result = new ArrayList<AppointmentSlot>();
            LocalDateTime currentStart = windowStart;
            int count = 0;
            
            // Round-robin indices for doctor assignment
            int morningDoctorIndex = 0;
            int afternoonDoctorIndex = 0;

            while (!currentStart.plusMinutes(slotDurationMinutes).isAfter(windowEnd)) {
                LocalTime slotTime = currentStart.toLocalTime();
                
                // Determine which doctor list to use based on slot time
                List<Doctor> availableDoctors;
                int doctorIndex;
                
                if (slotTime.isBefore(noon)) {
                    // Morning slot
                    availableDoctors = morningDoctors;
                    doctorIndex = morningDoctorIndex;
                    if (!availableDoctors.isEmpty()) {
                        morningDoctorIndex = (morningDoctorIndex + 1) % availableDoctors.size();
                    }
                } else {
                    // Afternoon slot (12:00 and after)
                    availableDoctors = afternoonDoctors;
                    doctorIndex = afternoonDoctorIndex;
                    if (!availableDoctors.isEmpty()) {
                        afternoonDoctorIndex = (afternoonDoctorIndex + 1) % availableDoctors.size();
                    }
                }

                var slot = new AppointmentSlot();
                slot.setClinic(clinic);
                
                // Assign doctor using round-robin if available
                if (!availableDoctors.isEmpty()) {
                    Doctor assignedDoctor = availableDoctors.get(doctorIndex);
                    slot.setDoctor(assignedDoctor);
                    log.debug("Creating slot #{}: {} to {} - assigned to Dr. {}", 
                            ++count, currentStart, currentStart.plusMinutes(slotDurationMinutes), 
                            assignedDoctor.getName());
                } else {
                    slot.setDoctor(null);
                    log.warn("Creating slot #{}: {} to {} - NO DOCTOR AVAILABLE", 
                            ++count, currentStart, currentStart.plusMinutes(slotDurationMinutes));
                }
                
                slot.setStartTime(currentStart);
                slot.setEndTime(currentStart.plusMinutes(slotDurationMinutes));
                slot.setStatus(AppointmentStatus.AVAILABLE);

                result.add(slotRepo.save(slot));

                // Next slot starts after appointment duration + buffer time
                currentStart = currentStart.plusMinutes(slotDurationMinutes + intervalMinutes);
            }

            log.info("Successfully generated {} slots", result.size());
            return result;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("ERROR in generateSlotsForDate: clinicId={}, date={}, error={}", clinicId, date, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public AppointmentSlot createCustomSlot(Long clinicId, Long doctorId, LocalDateTime startTime, LocalDateTime endTime) {
        var clinic = clinicRepo.findById(clinicId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Clinic not found: " + clinicId));
        var doctor = doctorRepo.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        var slot = new AppointmentSlot();
        slot.setClinic(clinic);
        slot.setDoctor(doctor);
        slot.setStartTime(startTime);
        slot.setEndTime(endTime);
        slot.setStatus(AppointmentStatus.AVAILABLE);
        
        return slotRepo.save(slot);
    }

    @Transactional
    public void updateClinicInterval(Long clinicId, int intervalMinutes) {
        var clinic = clinicRepo.findById(clinicId)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
        
        clinic.setApptInterval(intervalMinutes);
        clinicRepo.save(clinic);
    }

    @Transactional(readOnly = true)
    public List<AppointmentSlot> getSlotsByInterval(Long clinicId, int intervalMinutes) {
        return slotRepo.findByClinicIdAndStatus(clinicId, AppointmentStatus.AVAILABLE);
    }

    @Transactional(readOnly = true)
    public List<AppointmentSlot> getAvailableSlotsByDoctor(Long doctorId, LocalDateTime startTime, LocalDateTime endTime) {
        return slotRepo.findByDoctorIdAndStartTimeBetweenAndStatus(doctorId, startTime, endTime, AppointmentStatus.AVAILABLE);
    }
    
    @Transactional(readOnly = true)
    public List<AppointmentSlot> getSlotsByClinicAndDate(Long clinicId, LocalDateTime startTime, LocalDateTime endTime) {
        return slotRepo.findByStartTimeBetween(startTime, endTime)
                .stream()
                .filter(slot -> slot.getClinic().getId().equals(clinicId))
                .sorted((a, b) -> {
                    // Sort by start time first
                    int timeComparison = a.getStartTime().compareTo(b.getStartTime());
                    if (timeComparison != 0) {
                        return timeComparison;
                    }
                    // If same time, sort by doctor name
                    String doctorNameA = a.getDoctor() != null ? a.getDoctor().getName() : "";
                    String doctorNameB = b.getDoctor() != null ? b.getDoctor().getName() : "";
                    return doctorNameA.compareTo(doctorNameB);
                })
                .toList();
    }
    
    @Transactional
    public AppointmentSlot assignDoctorToSlot(Long slotId, Long doctorId) {
        var slot = slotRepo.findById(slotId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Appointment slot not found: " + slotId));

        if (doctorId == null) {
            slot.setDoctor(null);
            return slotRepo.save(slot);
        }

        var doctor = doctorRepo.findById(doctorId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Doctor not found: " + doctorId));

        // Validate doctor availability for the slot's time
        LocalTime slotTime = slot.getStartTime().toLocalTime();
        LocalTime noon = LocalTime.of(12, 0);
        boolean isMorning = slotTime.isBefore(noon);
        
        if (isMorning && (doctor.getMorning() == null || !doctor.getMorning())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Doctor " + doctor.getName() + " is not available for morning sessions.");
        }
        
        if (!isMorning && (doctor.getAfternoon() == null || !doctor.getAfternoon())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Doctor " + doctor.getName() + " is not available for afternoon sessions.");
        }

        slot.setDoctor(doctor);
        return slotRepo.save(slot);
    }

    @Transactional(readOnly = true)
    public List<String> findDatesWithSlots(Long clinicId, LocalDate startDate, LocalDate endDate) {
        log.info("Finding dates with slots for clinic {} between {} and {}", clinicId, startDate, endDate);
        
        try {
            // Use the existing repository method to find distinct dates
            // The repository now returns strings directly
            List<String> dates = slotRepo.findDistinctDatesByClinicAndDateRange(
                clinicId,
                startDate.toString(),
                endDate.toString()
            );
            
            log.info("Found slots on {} dates", dates.size());
            return dates;
        } catch (Exception ex) {
            log.error("Error finding dates with slots", ex);
            return List.of();
        }
    }

    @Transactional
    public void deleteSlotsByClinicAndDateRange(Long clinicId, LocalDateTime startTime, LocalDateTime endTime) {
        log.info("Deleting slots for clinic {} between {} and {}", clinicId, startTime, endTime);
        slotRepo.deleteByClinicIdAndStartTimeBetween(clinicId, startTime, endTime);
        log.info("Deleted slots successfully");
    }

    public DeleteSlotsOutcome deleteSlotsByDates(Long clinicId, List<String> dateStrings) {
        log.info("Deleting slots for clinic {} on {} dates", clinicId, dateStrings.size());

        try {
            int totalDeleted = 0;
            int totalSkipped = 0;

            for (String dateStr : dateStrings) {
                LocalDate date = LocalDate.parse(dateStr);
                LocalDateTime startOfDay = date.atStartOfDay();
                LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

                List<AppointmentSlot> slots = slotRepo.findByClinicIdAndStartTimeBetween(clinicId, startOfDay, endOfDay);

                if (slots.isEmpty()) {
                    continue;
                }

                var lockedSlotIds = slots.stream()
                        .filter(slot -> historyRepo.existsBySlotId(slot.getId()))
                        .map(AppointmentSlot::getId)
                        .collect(Collectors.toSet());

                List<AppointmentSlot> deletableSlots = slots.stream()
                        .filter(slot -> !lockedSlotIds.contains(slot.getId()))
                        .collect(Collectors.toList());

                if (!deletableSlots.isEmpty()) {
                    slotRepo.deleteAll(deletableSlots);
                    totalDeleted += deletableSlots.size();
                }

                totalSkipped += lockedSlotIds.size();

                if (!lockedSlotIds.isEmpty()) {
                    log.info("Skipped deleting {} slot(s) on {} because they have appointment history", lockedSlotIds.size(), dateStr);
                }
            }

            log.info("Deleted {} slots, skipped {}", totalDeleted, totalSkipped);
            return new DeleteSlotsOutcome(totalDeleted, totalSkipped);
        } catch (Exception ex) {
            log.error("Error deleting slots by dates", ex);
            throw ex;
        }
    }

    public record DeleteSlotsOutcome(int deleted, int skipped) {}
}
