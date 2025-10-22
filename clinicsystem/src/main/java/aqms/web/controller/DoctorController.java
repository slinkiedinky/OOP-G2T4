package aqms.web.controller;

import aqms.domain.model.Doctor;
import aqms.repository.DoctorRepository;
import aqms.repository.ClinicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {
    private final DoctorRepository doctorRepo;
    private final ClinicRepository clinicRepo;

    public record CreateDoctorRequest(
            @NotBlank String name,
            @NotBlank String specialization,
            @NotNull Long clinicId
    ) {}

    public record UpdateDoctorRequest(
            @NotBlank String name,
            @NotBlank String specialization
    ) {}

    @PostMapping
    public ResponseEntity<Doctor> createDoctor(@RequestBody CreateDoctorRequest request) {
        var clinic = clinicRepo.findById(request.clinicId())
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
        
        var doctor = new Doctor();
        doctor.setName(request.name());
        doctor.setSpecialization(request.specialization());
        doctor.setClinic(clinic);
        
        var savedDoctor = doctorRepo.save(doctor);
        return ResponseEntity.ok(savedDoctor);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctor(@PathVariable Long id) {
        var doctor = doctorRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        return ResponseEntity.ok(doctor);
    }

    @GetMapping
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        var doctors = doctorRepo.findAll();
        return ResponseEntity.ok(doctors);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Doctor> updateDoctor(@PathVariable Long id, @RequestBody UpdateDoctorRequest request) {
        var doctor = doctorRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        doctor.setName(request.name());
        doctor.setSpecialization(request.specialization());
        
        var updatedDoctor = doctorRepo.save(doctor);
        return ResponseEntity.ok(updatedDoctor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        doctorRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}







