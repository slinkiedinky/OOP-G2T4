package aqms.repository;

import aqms.domain.enums.*;
import aqms.domain.model.*;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;

/**
 * AppointmentHistoryRepository
 *
 * Repository for AppointmentHistory audit records. Provides queries to check for historical
 * events related to an appointment slot.
 */
public interface AppointmentHistoryRepository extends JpaRepository<AppointmentHistory, Long> {
  boolean existsBySlotId(Long slotId);
}
