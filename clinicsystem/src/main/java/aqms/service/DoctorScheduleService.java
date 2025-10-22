package aqms.service;

import aqms.domain.model.DoctorSchedule; import aqms.repository.DoctorRepository; import aqms.repository.DoctorScheduleRepository;
import lombok.RequiredArgsConstructor; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime; import java.util.List;

@Service @RequiredArgsConstructor
public class DoctorScheduleService {
  private final DoctorScheduleRepository scheduleRepo; private final DoctorRepository doctorRepo;

  @Transactional(readOnly = true)
  public List<DoctorSchedule> getDoctorSchedules(Long doctorId) {
    return scheduleRepo.findByDoctorId(doctorId);
  }

  @Transactional(readOnly = true)
  public List<DoctorSchedule> getAvailableDoctorSchedules(Long doctorId) {
    return scheduleRepo.findByDoctorIdAndAvailableTrue(doctorId);
  }

  @Transactional
  public DoctorSchedule addScheduleSlot(Long doctorId, LocalDateTime startTime, LocalDateTime endTime) {
    var doctor = doctorRepo.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));
    var schedule = new DoctorSchedule();
    schedule.setDoctor(doctor); schedule.setStartTime(startTime); schedule.setEndTime(endTime); schedule.setAvailable(true);
    return scheduleRepo.save(schedule);
  }

  @Transactional
  public DoctorSchedule updateAvailability(Long scheduleId, boolean available) {
    var schedule = scheduleRepo.findById(scheduleId).orElseThrow(() -> new RuntimeException("Schedule not found"));
    schedule.setAvailable(available);
    return scheduleRepo.save(schedule);
  }

  @Transactional
  public void removeScheduleSlot(Long scheduleId) {
    var schedule = scheduleRepo.findById(scheduleId).orElseThrow(() -> new RuntimeException("Schedule not found"));
    scheduleRepo.delete(schedule);
  }
}
