package aqms.service;

import aqms.domain.enums.AppointmentStatus; import aqms.domain.model.AppointmentSlot; import aqms.repository.AppointmentSlotRepository;
import aqms.repository.ClinicRepository; import aqms.repository.DoctorRepository; import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import java.time.*; import java.util.List;

@Service @RequiredArgsConstructor @Slf4j
public class AppointmentSlotManagementService {
  private final AppointmentSlotRepository slotRepo; 
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
                    .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.NOT_FOUND, "Clinic not found: " + clinicId));
            log.info("Clinic found: {}", clinic.getName());

            LocalDateTime startOfDay = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime endOfDay = LocalDateTime.of(date, LocalTime.MAX);
            log.info("Deleting existing slots between {} and {}", startOfDay, endOfDay);
            slotRepo.deleteByClinicIdAndStartTimeBetween(clinicId, startOfDay, endOfDay);
            log.info("Deleted existing slots successfully");

            LocalDateTime windowStart = LocalDateTime.of(date, openTime);
            LocalDateTime windowEnd = LocalDateTime.of(date, closeTime);
            log.info("Generating NON-OVERLAPPING slots from {} to {} with {}min duration",
                    windowStart, windowEnd, slotDurationMinutes);

            var result = new java.util.ArrayList<AppointmentSlot>();
            LocalDateTime currentStart = windowStart;
            int count = 0;

            while (!currentStart.plusMinutes(slotDurationMinutes).isAfter(windowEnd)) {
                var slot = new AppointmentSlot();
                slot.setClinic(clinic);
                slot.setDoctor(null);
                slot.setStartTime(currentStart);
                slot.setEndTime(currentStart.plusMinutes(slotDurationMinutes));
                slot.setStatus(AppointmentStatus.AVAILABLE);

                log.debug("Creating slot #{}: {} to {}", ++count, currentStart, slot.getEndTime());
                result.add(slotRepo.save(slot));

                // Next slot starts after appointment duration + buffer time
                currentStart = currentStart.plusMinutes(slotDurationMinutes + intervalMinutes);
            }

            log.info("Successfully generated {} slots", result.size());
            return result;
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
                .toList();
    }
    
    @Transactional
    public AppointmentSlot assignDoctorToSlot(Long slotId, Long doctorId) {
        var slot = slotRepo.findById(slotId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Appointment slot not found: " + slotId));

        if (doctorId == null) {
            slot.setDoctor(null);
            return slotRepo.save(slot);
        }

        var doctor = doctorRepo.findById(doctorId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Doctor not found: " + doctorId));

        slot.setDoctor(doctor);
        return slotRepo.save(slot);
    }

    @Transactional(readOnly = true)
    public List<LocalDate> findDatesWithSlots(Long clinicId, LocalDate startDate, LocalDate endDate) {
        log.info("Finding dates with slots for clinic {} from {} to {}", clinicId, startDate, endDate);
        return slotRepo.findDistinctDatesByClinicAndDateRange(clinicId, startDate, endDate);
    }

    @Transactional
    public void deleteSlotsByClinicAndDateRange(Long clinicId, LocalDateTime startTime, LocalDateTime endTime) {
        log.info("Deleting slots for clinic {} between {} and {}", clinicId, startTime, endTime);
        slotRepo.deleteByClinicIdAndStartTimeBetween(clinicId, startTime, endTime);
        log.info("Deleted slots successfully");
    }
}
