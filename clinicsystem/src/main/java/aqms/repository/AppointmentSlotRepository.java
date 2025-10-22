package aqms.repository;
import org.springframework.data.jpa.repository.*; import aqms.domain.model.*; import aqms.domain.enums.*; 
import java.time.*; import java.util.*;

public interface AppointmentSlotRepository extends JpaRepository<AppointmentSlot, Long> {
  @Query("""
    select s from AppointmentSlot s
    where s.clinic.id = :clinicId
      and (:doctorId is null or s.doctor.id = :doctorId)
      and s.status = aqms.domain.enums.AppointmentStatus.AVAILABLE
      and function('DATE', s.startTime) = function('DATE', :onDate)
  """)
  List<AppointmentSlot> findAvailable(Long clinicId, Long doctorId, LocalDateTime onDate);

  List<AppointmentSlot> findByPatientIdOrderByStartTimeAsc(Long patientId);
  
  List<AppointmentSlot> findByClinicIdAndStatus(Long clinicId, AppointmentStatus status);
  
  List<AppointmentSlot> findByDoctorIdAndStartTimeBetweenAndStatus(Long doctorId, LocalDateTime startTime, LocalDateTime endTime, AppointmentStatus status);
}
