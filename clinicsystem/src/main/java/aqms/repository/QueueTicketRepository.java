package aqms.repository;
import org.springframework.data.jpa.repository.*; import aqms.domain.model.*; import aqms.domain.enums.*; 
import java.time.*; import java.util.*;

public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {
  List<QueueTicket> findByClinicIdAndStatusOrderByPositionAsc(Long clinicId, QueueStatus status);
  Optional<QueueTicket> findTopByClinicIdOrderByPositionDesc(Long clinicId);
}