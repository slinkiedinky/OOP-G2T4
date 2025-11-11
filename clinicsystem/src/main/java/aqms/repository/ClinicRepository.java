package aqms.repository;
import org.springframework.data.jpa.repository.*; import aqms.domain.model.*; import aqms.domain.enums.*; 
import java.time.*; import java.util.*;

/**
 * ClinicRepository
 *
 * Data access for Clinic entities. Used to load and persist clinic
 * metadata and relationships to doctors and appointment configuration.
 */
public interface ClinicRepository extends JpaRepository<Clinic, Long> {}
