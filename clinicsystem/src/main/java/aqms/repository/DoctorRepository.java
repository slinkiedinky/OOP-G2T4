package aqms.repository;

import aqms.domain.enums.*;
import aqms.domain.model.*;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;

/**
 * DoctorRepository
 *
 * Data access for Doctor entities. Includes helper queries to list doctors by clinic and count
 * doctors for a clinic used in scheduling logic.
 */
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
  List<Doctor> findByClinicId(Long clinicId);

  long countByClinicId(Long clinicId);
}
