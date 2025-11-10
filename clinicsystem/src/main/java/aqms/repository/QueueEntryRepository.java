package aqms.repository;

import aqms.domain.model.QueueEntry;
import aqms.domain.enums.QueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {
  @Query("select q from QueueEntry q where q.clinicId = :clinicId and q.createdAt >= :from and q.createdAt <= :to order by q.queueNumber asc")
  List<QueueEntry> findByClinicAndCreatedAtBetweenOrderByQueueNumber(@Param("clinicId") Long clinicId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

  Optional<QueueEntry> findTopByClinicIdAndStatusOrderByQueueNumberAsc(Long clinicId, QueueStatus status);

  // find the earliest fast-tracked queued entry (to be served next)
  Optional<QueueEntry> findTopByClinicIdAndStatusAndFastTrackedTrueOrderByFastTrackedAtAsc(Long clinicId, QueueStatus status);

  Optional<QueueEntry> findBySlotId(Long slotId);

  // Find entries for a clinic with a specific status
  List<QueueEntry> findByClinicIdAndStatus(Long clinicId, aqms.domain.enums.QueueStatus status);

  // Return all entries for a clinic (no date filter) ordered by created_at desc
  List<QueueEntry> findByClinicIdOrderByCreatedAtDesc(Long clinicId);

  // Helper to quickly check if there are any active queue entries for a clinic
  boolean existsByClinicIdAndStatusIn(Long clinicId, List<aqms.domain.enums.QueueStatus> statuses);

  // Delete entries created before the provided cutoff (used to reset queues at midnight)
  long deleteByCreatedAtBefore(java.time.LocalDateTime cutoff);
}
