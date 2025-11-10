// This code was modified from an AI-generated code using Gemini 2.5 Pro.

package aqms.repository;

import java.time.LocalDateTime;
import java.util.List;

import aqms.domain.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;



@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, String> {

    /**
     * custom query method.
     *
    */
    List<Appointment> findAllByStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
    List<Appointment> findAllByStartTimeGreaterThanEqualAndStartTimeLessThan(
            LocalDateTime startTime, 
            LocalDateTime endTime
        );
}
