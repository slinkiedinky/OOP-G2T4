package aqms.web.controller;

import aqms.domain.model.*;
import aqms.repository.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clinics")
@RequiredArgsConstructor
/**
 * ClinicController
 *
 * Public endpoints for listing clinics and retrieving clinic-specific data such as associated
 * doctors. Used by patient-facing UI flows.
 */
public class ClinicController {
  private final ClinicRepository clinics;
  private final DoctorRepository doctors;

  @GetMapping
  public List<Clinic> list() {
    return clinics.findAll();
  }

  @GetMapping("/{clinicId}/doctors")
  public List<Doctor> doctors(@PathVariable Long clinicId) {
    return doctors.findByClinicId(clinicId);
  }

  @GetMapping("/clinics")
  public List<Clinic> getAllClinics() {
    return clinics.findAll();
  }

  // Get specific clinic
  @GetMapping("/clinics/{clinicId}")
  public Clinic getClinic(@PathVariable Long clinicId) {
    return clinics
        .findById(clinicId)
        .orElseThrow(() -> new IllegalArgumentException("Clinic not found"));
  }

  // Get all doctors in a clinic
  @GetMapping("/clinics/{clinicId}/doctors")
  public List<Doctor> getAllDoctors(@PathVariable Long clinicId) {
    return doctors.findByClinicId(clinicId);
  }
}
