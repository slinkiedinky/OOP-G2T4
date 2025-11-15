package aqms.repository;

import aqms.domain.model.AppointmentSlot;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentRepository extends JpaRepository<AppointmentSlot, Long> {

  /**
   * AppointmentRepository
   *
   * JPA repository for AppointmentSlot entities. Provides CRUD operations and custom query
   * methods for querying appointment slots by time range.
   */
  List<AppointmentSlot> findAllByStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
}
