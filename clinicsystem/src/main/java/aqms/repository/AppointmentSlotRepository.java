package aqms.repository;
import org.springframework.data.jpa.repository.*; 
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import aqms.domain.model.*; 
import java.time.*; import java.util.*;
import aqms.domain.enums.AppointmentStatus;

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

  List<AppointmentSlot> findByClinicIdAndStartTimeBetween(Long clinicId, LocalDateTime startTime, LocalDateTime endTime);

  // Find distinct dates that have slots in a date range
  @Query(value = "SELECT DISTINCT CAST(start_time AS DATE)::text " +
                 "FROM appointment_slot " +
                 "WHERE clinic_id = :clinicId " +
                 "AND start_time >= CAST(:startDate AS DATE) " +
                 "AND start_time <= CAST(:endDate AS DATE) + INTERVAL '1 day' " +
                 "ORDER BY CAST(start_time AS DATE)::text", 
         nativeQuery = true)
  List<String> findDistinctDatesByClinicAndDateRange(
      @Param("clinicId") Long clinicId,
      @Param("startDate") String startDate,
      @Param("endDate") String endDate
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

  // Find available slots by clinic and date
  @Query("SELECT a FROM AppointmentSlot a WHERE a.clinic.id = :clinicId " +
        "AND a.startTime BETWEEN :start AND :end " +
        "AND a.status = 'AVAILABLE' " +
        "ORDER BY a.startTime")
  List<AppointmentSlot> findAvailableByClinicAndDate(
      @Param("clinicId") Long clinicId,
      @Param("start") LocalDateTime start,
      @Param("end") LocalDateTime end
  );

  // Find available slots by clinic, date, and doctor
  @Query("SELECT a FROM AppointmentSlot a WHERE a.clinic.id = :clinicId " +
        "AND a.doctor.id = :doctorId " +
        "AND a.startTime BETWEEN :start AND :end " +
        "AND a.status = 'AVAILABLE' " +
        "ORDER BY a.startTime")
  List<AppointmentSlot> findAvailableByClinicDateAndDoctor(
      @Param("clinicId") Long clinicId,
      @Param("start") LocalDateTime start,
      @Param("end") LocalDateTime end,
      @Param("doctorId") Long doctorId
  );

  List<AppointmentSlot> findByStatus(AppointmentStatus status);
}
