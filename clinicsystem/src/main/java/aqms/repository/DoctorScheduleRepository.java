package aqms.repository;

import aqms.domain.model.DoctorSchedule;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * DoctorScheduleRepository
 *
 * Data access for doctor schedule blocks. Used by scheduling services to retrieve a doctor's
 * shifts and available slots for appointment generation.
 */
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {
  List<DoctorSchedule> findByDoctorId(Long doctorId);

  List<DoctorSchedule> findByDoctorIdAndAvailableTrue(Long doctorId);
}
