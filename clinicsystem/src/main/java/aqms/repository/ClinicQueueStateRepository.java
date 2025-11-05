package aqms.repository;

import aqms.domain.model.ClinicQueueState;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ClinicQueueStateRepository extends JpaRepository<ClinicQueueState, Long> {
  Optional<ClinicQueueState> findByClinicId(Long clinicId);
}
