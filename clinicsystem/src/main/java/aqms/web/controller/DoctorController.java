package aqms.web.controller;

import aqms.domain.model.Doctor;
import aqms.repository.ClinicRepository;
import aqms.repository.DoctorRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
/**
 * DoctorController
 *
 * CRUD endpoints for doctors. Supports creating, updating and listing doctors and basic
 * validation to ensure session coverage in clinics.
 */
public class DoctorController {
  private final DoctorRepository doctorRepo;
  private final ClinicRepository clinicRepo;

  public record CreateDoctorRequest(
      @NotBlank String name,
      @NotBlank String specialization,
      @NotNull Long clinicId,
      Boolean morning,
      Boolean afternoon) {}

  public record UpdateDoctorRequest(
      @NotBlank String name,
      @NotBlank String specialization,
      Long clinicId,
      Boolean morning,
      Boolean afternoon) {}

  @PostMapping
  public ResponseEntity<Doctor> createDoctor(@RequestBody CreateDoctorRequest request) {
    try {
      var clinic =
          clinicRepo
              .findById(request.clinicId())
              .orElseThrow(() -> new RuntimeException("Clinic not found"));

      // Default to true if not provided
      boolean morning = request.morning() != null ? request.morning() : true;
      boolean afternoon = request.afternoon() != null ? request.afternoon() : true;

      // Validation: Check existing doctors for this clinic
      List<Doctor> existingDoctors = doctorRepo.findByClinicId(request.clinicId());

      // If this is the first doctor, both sessions must be available
      if (existingDoctors.isEmpty()) {
        if (!morning || !afternoon) {
          throw new IllegalArgumentException(
              "The first doctor must be available for both morning and afternoon sessions.");
        }
      } else {
        // If there are existing doctors, ensure at least one session has coverage
        long morningCount =
            existingDoctors.stream().filter(d -> d.getMorning() != null && d.getMorning()).count();
        long afternoonCount =
            existingDoctors.stream()
                .filter(d -> d.getAfternoon() != null && d.getAfternoon())
                .count();

        if (!morning && morningCount == 0) {
          throw new IllegalArgumentException(
              "At least one doctor must be available for morning sessions.");
        }

        if (!afternoon && afternoonCount == 0) {
          throw new IllegalArgumentException(
              "At least one doctor must be available for afternoon sessions.");
        }
      }

      var doctor = new Doctor();
      doctor.setName(request.name());
      doctor.setSpecialization(request.specialization());
      doctor.setClinic(clinic);
      doctor.setMorning(morning);
      doctor.setAfternoon(afternoon);

      var savedDoctor = doctorRepo.save(doctor);
      return ResponseEntity.ok(savedDoctor);
    } catch (IllegalArgumentException e) {
      // Re-throw validation exceptions to preserve error message
      throw e;
    } catch (RuntimeException e) {
      // Re-throw to preserve error message
      throw e;
    } catch (Exception e) {
      throw new RuntimeException("Failed to create doctor: " + e.getMessage(), e);
    }
  }

  @GetMapping("/{id}")
  public ResponseEntity<Doctor> getDoctor(@PathVariable Long id) {
    var doctor =
        doctorRepo.findById(id).orElseThrow(() -> new RuntimeException("Doctor not found"));
    return ResponseEntity.ok(doctor);
  }

  @GetMapping
  public ResponseEntity<List<Doctor>> getAllDoctors() {
    var doctors = doctorRepo.findAll();
    return ResponseEntity.ok(doctors);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Doctor> updateDoctor(
      @PathVariable Long id, @RequestBody UpdateDoctorRequest request) {
    var doctor =
        doctorRepo.findById(id).orElseThrow(() -> new RuntimeException("Doctor not found"));

    Long clinicId = doctor.getClinic().getId();
    boolean morning =
        request.morning() != null
            ? request.morning()
            : doctor.getMorning() != null ? doctor.getMorning() : true;
    boolean afternoon =
        request.afternoon() != null
            ? request.afternoon()
            : doctor.getAfternoon() != null ? doctor.getAfternoon() : true;

    // Validation: if clinic has only 1 doctor, both must be true
    validateDoctorAvailability(clinicId, id, morning, afternoon);

    doctor.setName(request.name());
    doctor.setSpecialization(request.specialization());
    doctor.setMorning(morning);
    doctor.setAfternoon(afternoon);

    var updatedDoctor = doctorRepo.save(doctor);
    return ResponseEntity.ok(updatedDoctor);
  }

  private void validateDoctorAvailability(
      Long clinicId, Long doctorId, boolean morning, boolean afternoon) {
    // Get all doctors in this clinic
    List<Doctor> allDoctors = doctorRepo.findByClinicId(clinicId);

    // Filter out the doctor being edited to get OTHER doctors
    List<Doctor> otherDoctors =
        allDoctors.stream().filter(d -> !d.getId().equals(doctorId)).toList();

    // Count other doctors available for each session
    long morningCount =
        otherDoctors.stream().filter(d -> d.getMorning() != null && d.getMorning()).count();

    long afternoonCount =
        otherDoctors.stream().filter(d -> d.getAfternoon() != null && d.getAfternoon()).count();

    // Validate morning availability
    if (!morning && morningCount == 0) {
      throw new IllegalArgumentException(
          "Cannot disable morning availability. At least one doctor must be available for morning sessions.");
    }

    // Validate afternoon availability
    if (!afternoon && afternoonCount == 0) {
      throw new IllegalArgumentException(
          "Cannot disable afternoon availability. At least one doctor must be available for afternoon sessions.");
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
    doctorRepo.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
