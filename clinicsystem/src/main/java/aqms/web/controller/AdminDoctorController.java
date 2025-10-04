package aqms.web.controller;

import aqms.domain.model.Clinic;
import aqms.domain.model.Doctor;
import aqms.repository.ClinicRepository;
import aqms.repository.DoctorRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/doctors")
public class AdminDoctorController {

    private final DoctorRepository doctorRepository;
    private final ClinicRepository clinicRepository;

    public AdminDoctorController(DoctorRepository doctorRepository, ClinicRepository clinicRepository) {
        this.doctorRepository = doctorRepository;
        this.clinicRepository = clinicRepository;
    }

    //  Add Doctor to Clinic 
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{doctorId}/add-to-clinic")
    public String addDoctorToClinic(@PathVariable Long doctorId, @RequestParam Long clinicId) {
        try {
            if (doctorId == null || doctorId <= 0) {
                return "Error: Invalid doctor ID.";
            } else {
                // ok, continue
            }

            if (clinicId == null || clinicId <= 0) {
                return "Error: Invalid clinic ID.";
            } else {
                // ok, continue
            }

            Doctor doctor = null;
            if (doctorRepository.existsById(doctorId)) {
                Optional<Doctor> optionalDoctor = doctorRepository.findById(doctorId);
                if (optionalDoctor.isPresent()) {
                    doctor = optionalDoctor.get();
                } else {
                    return "Error: Doctor not found after checking ID.";
                }
            } else {
                return "Error: Doctor not found with ID: " + doctorId;
            }

            Clinic clinic = null;
            if (clinicRepository.existsById(clinicId)) {
                Optional<Clinic> optionalClinic = clinicRepository.findById(clinicId);
                if (optionalClinic.isPresent()) {
                    clinic = optionalClinic.get();
                } else {
                    return "Error: Clinic not found after checking ID.";
                }
            } else {
                return "Error: Clinic not found with ID: " + clinicId;
            }

            if (doctor.getClinic() != null) {
                if (doctor.getClinic().getId().equals(clinicId)) {
                    return "Doctor " + doctor.getName() + " is already assigned to this clinic.";
                } else {
                    return "Doctor " + doctor.getName() + " is already in another clinic.";
                }
            } else {
                // doctor is free to assign
            }

            doctor.setClinic(clinic);
            doctorRepository.save(doctor);

            return "SUCCESS: Doctor " + doctor.getName() + " added to clinic " + clinic.getName();

        } catch (Exception e) {
            e.printStackTrace();
            return "Error: Something went wrong. " + e.getMessage();
        }
    }

    //  Remove Doctor from Clinic
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{doctorId}/remove-from-clinic")
    public String removeDoctorFromClinic(@PathVariable Long doctorId, @RequestParam Long clinicId) {
        try {
            if (doctorId == null || doctorId <= 0) {
                return "Error: Invalid doctor ID.";
            }

            if (clinicId == null || clinicId <= 0) {
                return "Error: Invalid clinic ID.";
            }

            Doctor doctor = null;
            if (doctorRepository.existsById(doctorId)) {
                Optional<Doctor> optionalDoctor = doctorRepository.findById(doctorId);
                if (optionalDoctor.isPresent()) {
                    doctor = optionalDoctor.get();
                } else {
                    return "Error: Doctor not found after checking ID.";
                }
            } else {
                return "Error: Doctor not found with ID: " + doctorId;
            }

            if (doctor.getClinic() == null) {
                return "Doctor " + doctor.getName() + " is not assigned to any clinic.";
            }

            if (!doctor.getClinic().getId().equals(clinicId)) {
                return "Error: Doctor " + doctor.getName() + " does not belong to clinic " + clinicId;
            }

            String clinicName = doctor.getClinic().getName();
            doctor.setClinic(null);
            doctorRepository.save(doctor);

            return "SUCCESS: Doctor " + doctor.getName() + " removed from clinic " + clinicName;

        } catch (Exception e) {
            e.printStackTrace();
            return "Error: Something went wrong. " + e.getMessage();
        }
    }

    //  Get Doctors in a Clinic
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/clinic/{clinicId}")
    public Object getDoctorsInClinic(@PathVariable Long clinicId) {
        try {
            if (clinicId == null || clinicId <= 0) {
                return "Error: Invalid clinic ID.";
            }

            if (!clinicRepository.existsById(clinicId)) {
                return "Error: Clinic not found with ID: " + clinicId;
            }

            List<Doctor> doctors = doctorRepository.findByClinicId(clinicId);

            if (doctors == null) {
                return "Error: Doctor list is null.";
            } else {
                if (doctors.isEmpty()) {
                    return "No doctors found in clinic ID: " + clinicId;
                }
            }

            return doctors;

        } catch (Exception e) {
            e.printStackTrace();
            return "Error: Something went wrong. " + e.getMessage();
        }
    }

    //  Get All Doctors git branch

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public Object getAllDoctors() {
        try {
            List<Doctor> allDoctors = doctorRepository.findAll();

            if (allDoctors == null) {
                return "Error: Doctor list is null.";
            } else {
                if (allDoctors.isEmpty()) {
                    return "No doctors found in the system.";
                } else {
                    return allDoctors;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Error: Something went wrong. " + e.getMessage();
        }
    }
}
