package aqms.repository;
import org.springframework.data.jpa.repository.*; import aqms.domain.model.*; import aqms.domain.enums.*; 
import java.time.*; import java.util.*;

/**
 * DoctorRepository
 *
 * Data access for Doctor entities. Includes helper queries to list
 * doctors by clinic and count doctors for a clinic used in scheduling logic.
 */
public interface DoctorRepository extends JpaRepository<Doctor, Long> { 
  List<Doctor> findByClinicId(Long clinicId); 
  long countByClinicId(Long clinicId);
}