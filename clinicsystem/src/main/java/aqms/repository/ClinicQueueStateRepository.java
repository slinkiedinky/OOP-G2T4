package aqms.repository;

import aqms.domain.model.ClinicQueueState;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Repository for persisting and retrieving the per-clinic queue state.
 *
 * Provides convenience finder methods used by QueueService to maintain
 * and query the current queue position for a clinic.
 */
public interface ClinicQueueStateRepository extends JpaRepository<ClinicQueueState, Long> {
  Optional<ClinicQueueState> findByClinicId(Long clinicId);
}
