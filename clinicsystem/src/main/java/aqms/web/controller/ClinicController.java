package aqms.web.controller;

import aqms.domain.model.*; import aqms.repository.*; import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*; import java.util.List;

@RestController @RequestMapping("/api/clinics") @RequiredArgsConstructor
public class ClinicController {
  private final ClinicRepository clinics; private final DoctorRepository doctors;
  @GetMapping public List<Clinic> list(){ return clinics.findAll(); }
  
  @GetMapping("/{clinicId}/doctors")
  @PreAuthorize("hasRole('ADMIN')")
  public List<Doctor> doctors(@PathVariable Long clinicId){ return doctors.findByClinicId(clinicId); }
}