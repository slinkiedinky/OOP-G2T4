package aqms.repository;

import aqms.domain.enums.*;
import aqms.domain.model.*;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;

/**
 * ClinicRepository
 *
 * Data access for Clinic entities. Used to load and persist clinic metadata and relationships to
 * doctors and appointment configuration.
 */
public interface ClinicRepository extends JpaRepository<Clinic, Long> {}
