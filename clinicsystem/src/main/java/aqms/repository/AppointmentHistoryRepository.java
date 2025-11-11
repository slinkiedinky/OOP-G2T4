package aqms.repository;
import org.springframework.data.jpa.repository.*; import aqms.domain.model.*; import aqms.domain.enums.*; 
import java.time.*; import java.util.*;

/**
 * AppointmentHistoryRepository
 *
 * Repository for AppointmentHistory audit records. Provides queries to
 * check for historical events related to an appointment slot.
 */
public interface AppointmentHistoryRepository extends JpaRepository<AppointmentHistory, Long> {
  boolean existsBySlotId(Long slotId);
}

