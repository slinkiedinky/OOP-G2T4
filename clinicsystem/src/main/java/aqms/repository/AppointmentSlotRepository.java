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

  // Get upcoming appointments by clinic
  @Query("""
    select s from AppointmentSlot s
    where s.clinic.id = :clinicId
      and s.startTime >= :now
      and s.status != aqms.domain.enums.AppointmentStatus.CANCELLED
    order by s.startTime asc
  """)
  List<AppointmentSlot> findUpcomingByClinic(Long clinicId, LocalDateTime now);

  // Get upcoming appointments by clinic and date
  @Query("""
    select s from AppointmentSlot s
    where s.clinic.id = :clinicId
      and s.startTime >= :startOfDay
      and s.startTime <= :endOfDay
      and s.status != aqms.domain.enums.AppointmentStatus.CANCELLED
    order by s.startTime asc
  """)
  List<AppointmentSlot> findUpcomingByClinicAndDate(Long clinicId, LocalDateTime startOfDay, LocalDateTime endOfDay);

  // Get upcoming appointments by clinic, date, and doctor
  @Query("""
    select s from AppointmentSlot s
    where s.clinic.id = :clinicId
      and s.doctor.id = :doctorId
      and s.startTime >= :startOfDay
      and s.startTime <= :endOfDay
      and s.status != aqms.domain.enums.AppointmentStatus.CANCELLED
    order by s.startTime asc
  """)
  List<AppointmentSlot> findUpcomingByClinicDateAndDoctor(Long clinicId, LocalDateTime startOfDay, LocalDateTime endOfDay, Long doctorId);
}
