package aqms.repository;
import org.springframework.data.jpa.repository.*; import aqms.domain.model.*; import aqms.domain.enums.*; 
import java.time.*; import java.util.*;

/**
 * QueueTicketRepository
 *
 * Repository for persistent queue tickets used by the legacy ticketing/queue
 * subsystem. Exposes queries to list tickets by clinic and status and to
 * find the highest-position ticket for sequencing.
 */
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {
  List<QueueTicket> findByClinicIdAndStatusOrderByPositionAsc(Long clinicId, QueueStatus status);
  Optional<QueueTicket> findTopByClinicIdOrderByPositionDesc(Long clinicId);
}