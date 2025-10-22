package aqms.repository;

import aqms.domain.model.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {
    List<DoctorSchedule> findByDoctorId(Long doctorId);
    List<DoctorSchedule> findByDoctorIdAndAvailableTrue(Long doctorId);
}
