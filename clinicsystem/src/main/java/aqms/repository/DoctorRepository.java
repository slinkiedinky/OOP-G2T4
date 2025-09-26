package aqms.repository;
import org.springframework.data.jpa.repository.*; import aqms.domain.model.*; import aqms.domain.enums.*; 
import java.time.*; import java.util.*;

public interface DoctorRepository extends JpaRepository<Doctor, Long> { List<Doctor> findByClinicId(Long clinicId); }