package aqms.web.controller;

import aqms.domain.model.Clinic;
import aqms.domain.model.Doctor;
import aqms.repository.ClinicRepository;
import aqms.repository.DoctorRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/clinics")
public class AdminClinicController {

    private final ClinicRepository clinicRepository;
    private final DoctorRepository doctorRepository;

    
    public AdminClinicController(ClinicRepository clinicRepository, DoctorRepository doctorRepository) {
        this.clinicRepository = clinicRepository;
        this.doctorRepository = doctorRepository;
    }

    // Get Clinic Details 
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{clinicId}/details")
    public ClinicDetailsResponse getClinicDetails(@PathVariable Long clinicId) {
        Clinic clinic = null;
        List<Doctor> doctors = new ArrayList<>();

        try {
            Optional<Clinic> optionalClinic = clinicRepository.findById(clinicId);
            if (optionalClinic.isPresent()) {
                clinic = optionalClinic.get();
            } else {
                System.out.println("Clinic not found with ID: " + clinicId);
                return new ClinicDetailsResponse("Unknown", "Unknown", "Unknown", 0, doctors);
            }

            doctors = doctorRepository.findByClinicId(clinicId);

        } catch (Exception e) {
            e.printStackTrace();
            return new ClinicDetailsResponse("Error", "Error", "Error", 0, doctors);
        }

        return new ClinicDetailsResponse(
                clinic.getName(),
                clinic.getLocation(),
                clinic.getOperatingHours(),
                clinic.getNumRooms(),
                doctors
        );
    }

    //  Update Operating Hours 
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{clinicId}/operating-hours")
    public String updateOperatingHours(@PathVariable Long clinicId,
                                       @RequestBody String newOperatingHours) {
        try {
            Optional<Clinic> optionalClinic = clinicRepository.findById(clinicId);

            if (optionalClinic.isPresent()) {
                Clinic clinic = optionalClinic.get();
                clinic.setOperatingHours(newOperatingHours);
                clinicRepository.save(clinic);
                return "Operating hours updated successfully for clinic: " + clinic.getName();
            } else {
                return "Clinic not found with ID: " + clinicId;
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "Error occurred while updating operating hours.";
        }
    }

    // Update Number of Rooms 
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{clinicId}/rooms")
    public String updateNumberOfRooms(@PathVariable Long clinicId,
                                      @RequestParam int numRooms) {
        try {
            Optional<Clinic> optionalClinic = clinicRepository.findById(clinicId);

            if (optionalClinic.isPresent()) {
                Clinic clinic = optionalClinic.get();
                clinic.setNumRooms(numRooms);
                clinicRepository.save(clinic);
                return "Number of rooms updated to " + numRooms + " for clinic: " + clinic.getName();
            } else {
                return "Clinic not found with ID: " + clinicId;
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "Error occurred while updating number of rooms.";
        }
    }

    // Inner Response Class 
    public static class ClinicDetailsResponse {
        private String clinicName;
        private String location;
        private String operatingHours;
        private Integer numRooms;
        private List<Doctor> doctors;

        public ClinicDetailsResponse(String clinicName, String location,
                                     String operatingHours, Integer numRooms,
                                     List<Doctor> doctors) {
            this.clinicName = clinicName;
            this.location = location;
            this.operatingHours = operatingHours;
            this.numRooms = numRooms;
            this.doctors = doctors;
        }

        public String getClinicName() { return clinicName; }
        public String getLocation() { return location; }
        public String getOperatingHours() { return operatingHours; }
        public Integer getNumRooms() { return numRooms; }
        public List<Doctor> getDoctors() { return doctors; }
    }
}
