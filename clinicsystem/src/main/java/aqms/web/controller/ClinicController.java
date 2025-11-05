package aqms.web.controller;

import aqms.domain.model.*; import aqms.repository.*; import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*; import java.util.List;

@RestController @RequestMapping("/api/clinics") @RequiredArgsConstructor
public class ClinicController {
  private final ClinicRepository clinics; private final DoctorRepository doctors;
  @GetMapping public List<Clinic> list(){ return clinics.findAll(); }

  @GetMapping("/{clinicId}/doctors")
  public List<Doctor> doctors(@PathVariable Long clinicId){ return doctors.findByClinicId(clinicId); }

  @GetMapping("/clinics")
    public List<Clinic> getAllClinics() {
        return clinics.findAll();
    }

    // Get specific clinic
    @GetMapping("/clinics/{clinicId}")
    public Clinic getClinic(@PathVariable Long clinicId) {
        return clinics.findById(clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Clinic not found"));
    }

    // Get all doctors in a clinic
    @GetMapping("/clinics/{clinicId}/doctors")
    public List<Doctor> getAllDoctors(@PathVariable Long clinicId) {
      return doctors.findByClinicId(clinicId);
    }
}