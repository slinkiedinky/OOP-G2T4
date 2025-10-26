// This code was modified from an AI-generated code using Gemini 2.5 Pro.

package aqms.repository;

import java.time.LocalDateTime;
import java.util.List;

import aqms.domain.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/*
 * repository interface for appointment data
 * handles all database operations for Appointment entity
 * JpaRepository provides da standard CRUD methods
 * 1st generic type 'Appointment' --> entity da repository manages
 * 2nd generic type 'String' --> data type of da entity's primary key (@Id).
 */
@Repository
public class AppointmentRepository {
    /*
     * custom query method used by ReportService
     * spring data jpa will auto-crreate a query 
     * finding all appointments where startTime
     * field between 2 provided timetsmaps.
     * 
     * @param start and @param end
     * are the start and end of the time range,
     * corresponding to the start and end of the
     * day respectively.
     */
    List<Appointment> findAllByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
