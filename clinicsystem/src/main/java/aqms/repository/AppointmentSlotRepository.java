package aqms.repository;
import org.springframework.data.jpa.repository.*; 
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import aqms.domain.model.*; import aqms.domain.enums.*; 
import java.time.*; import java.util.*;

public interface AppointmentSlotRepository extends JpaRepository<AppointmentSlot, Long> {
  @Query("""
    select s from AppointmentSlot s
    where s.clinic.id = :clinicId
      and (:doctorId is null or s.doctor.id = :doctorId)
      and s.status = aqms.domain.enums.AppointmentStatus.AVAILABLE
and s.startTime >= :onDate and s.startTime < :nextDay  """)
List<AppointmentSlot> findAvailable(Long clinicId, Long doctorId, LocalDateTime onDate, LocalDateTime nextDay);

  List<AppointmentSlot> findByPatientIdOrderByStartTimeAsc(Long patientId);
  
  List<AppointmentSlot> findByClinicIdAndStatus(Long clinicId, AppointmentStatus status);
  
  List<AppointmentSlot> findByDoctorIdAndStartTimeBetweenAndStatus(Long doctorId, LocalDateTime startTime, LocalDateTime endTime, AppointmentStatus status);
  
  List<AppointmentSlot> findByStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

  @Modifying
  @Transactional
  void deleteByClinicIdAndStartTimeBetween(Long clinicId, LocalDateTime startTime, LocalDateTime endTime);

  // Find distinct dates that have slots in a date range
  @Query(value = "SELECT DISTINCT DATE(start_time) " +
                 "FROM appointment_slot " +
                 "WHERE clinic_id = :clinicId " +
                 "AND DATE(start_time) BETWEEN :startDate AND :endDate " +
                 "ORDER BY DATE(start_time)", 
         nativeQuery = true)
  List<LocalDate> findDistinctDatesByClinicAndDateRange(
      @Param("clinicId") Long clinicId,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate
  );

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
