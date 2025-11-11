package aqms.web.controller;

import aqms.domain.model.*; 
import aqms.repository.*; 
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*; 
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController 
@RequestMapping("/api/clinic-management") 
@RequiredArgsConstructor
// TEMPORARY: Disabled for testing
// @PreAuthorize("hasRole('ADMIN')")
/**
 * ClinicManagementController
 *
 * Admin-style endpoints for managing clinic metadata and associated doctors.
 */
public class ClinicManagementController {
  private final ClinicRepository clinics; 
  private final DoctorRepository doctors;

  public record CreateClinicRequest(
          @NotBlank String name,
          @NotBlank String location,
          @NotNull Integer apptInterval,
          String operatingHours
  ) {}

  public record UpdateClinicRequest(
          @NotBlank String name,
          @NotBlank String location,
          @NotNull Integer apptInterval
  ) {}

  @GetMapping 
  public List<Clinic> list(){ 
    return clinics.findAll(); 
  }

  @GetMapping("/test")
  public String test() {
    return "Hello from ClinicManagementController";
  }

  @GetMapping("/{clinicId}/doctors") 
  public List<Doctor> doctors(@PathVariable Long clinicId){ 
    return doctors.findByClinicId(clinicId); 
  }

  @PostMapping
  public ResponseEntity<Clinic> createClinic(@RequestBody CreateClinicRequest request) {
    var clinic = new Clinic();
    clinic.setName(request.name());
    clinic.setLocation(request.location());
    clinic.setApptInterval(request.apptInterval());
    clinic.setOperatingHours(request.operatingHours());
    
    var savedClinic = clinics.save(clinic);
    return ResponseEntity.ok(savedClinic);
  }

  @GetMapping("/{id}")
  public ResponseEntity<Clinic> getClinic(@PathVariable Long id) {
    var clinic = clinics.findById(id)
            .orElseThrow(() -> new RuntimeException("Clinic not found"));
    return ResponseEntity.ok(clinic);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Clinic> updateClinic(@PathVariable Long id, @RequestBody UpdateClinicRequest request) {
    var clinic = clinics.findById(id)
            .orElseThrow(() -> new RuntimeException("Clinic not found"));
    
    clinic.setName(request.name());
    clinic.setLocation(request.location());
    clinic.setApptInterval(request.apptInterval());
    
    var updatedClinic = clinics.save(clinic);
    return ResponseEntity.ok(updatedClinic);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteClinic(@PathVariable Long id) {
    clinics.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}







