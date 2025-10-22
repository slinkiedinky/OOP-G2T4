package aqms.service;

import aqms.domain.enums.AppointmentStatus; import aqms.domain.model.AppointmentSlot; import aqms.repository.AppointmentSlotRepository;
import aqms.repository.ClinicRepository; import aqms.repository.DoctorRepository; import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime; import java.time.temporal.ChronoUnit; import java.util.List;

@Service @RequiredArgsConstructor
public class AppointmentSlotManagementService {
  private final AppointmentSlotRepository slotRepo; private final ClinicRepository clinicRepo;
    private final DoctorRepository doctorRepo;

    @Transactional
    public List<AppointmentSlot> generateSlotsForDate(Long clinicId, Long doctorId, LocalDateTime date) {
        var clinic = clinicRepo.findById(clinicId)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
        var doctor = doctorRepo.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        var startOfDay = date.truncatedTo(ChronoUnit.DAYS);
        var endOfDay = startOfDay.plusDays(1);
        var intervalMinutes = clinic.getApptInterval();
        
        var slots = List.<AppointmentSlot>of();
        var currentTime = startOfDay;
        
        while (currentTime.isBefore(endOfDay)) {
            var endTime = currentTime.plusMinutes(intervalMinutes);
            
            var slot = new AppointmentSlot();
            slot.setClinic(clinic);
            slot.setDoctor(doctor);
            slot.setStartTime(currentTime);
            slot.setEndTime(endTime);
            slot.setStatus(AppointmentStatus.AVAILABLE);
            
            slots = List.<AppointmentSlot>of(slot);
            slotRepo.save(slot);
            
            currentTime = endTime;
        }
        
        return slots;
    }

    @Transactional
    public AppointmentSlot createCustomSlot(Long clinicId, Long doctorId, LocalDateTime startTime, LocalDateTime endTime) {
        var clinic = clinicRepo.findById(clinicId)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
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
}
