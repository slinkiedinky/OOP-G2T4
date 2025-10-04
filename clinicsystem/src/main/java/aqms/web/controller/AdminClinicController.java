package aqms.web.controller;

import aqms.domain.model.Clinic;
import aqms.domain.model.Doctor;
import aqms.repository.ClinicRepository;
import aqms.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/admin/clinics")
@RequiredArgsConstructor
public class AdminClinicController {
    
    // change to database we need
    private final ClinicRepository clinicRepository;
    private final DoctorRepository doctorRepository;
    

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{clinicId}/details")
    public ClinicDetailsResponse getClinicDetails(@PathVariable Long clinicId) {
        
        // Find the clinic by ID
        Clinic clinic = clinicRepository.findById(clinicId)
            .orElseThrow(() -> new RuntimeException("Clinic not found with ID: " + clinicId));
        
        // Get all doctors working at this clinic
        List<Doctor> doctors = doctorRepository.findByClinicId(clinicId);
        
        // return a response with all the information
        return new ClinicDetailsResponse(
            clinic.getName(),
            clinic.getLocation(),
            clinic.getOperatingHours(),
            clinic.getNumRooms(),
            doctors
        );
    }
    
    //Update clinic operating hours
    //URL: PUT /api/admin/clinics/{clinicId}/operating-hours
    //Only ADMIN users can access this
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{clinicId}/operating-hours")
    public String updateOperatingHours(@PathVariable Long clinicId, 
                                     @RequestBody String newOperatingHours) {
        
        //Find the clinic
        Clinic clinic = clinicRepository.findById(clinicId)
            .orElseThrow(() -> new RuntimeException("Clinic not found with ID: " + clinicId));
        
        //Update the operating hours
        clinic.setOperatingHours(newOperatingHours);
        
        // Save the changes to database
        clinicRepository.save(clinic);
        
        //Return success message
        return "Operating hours updated successfully for clinic: " + clinic.getName();
    }
    
    /**
     * Update number of rooms in clinic
     * URL: PUT /api/admin/clinics/{clinicId}/rooms?numRooms=5
     * Only ADMIN users can access this
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{clinicId}/rooms")
    public String updateNumberOfRooms(@PathVariable Long clinicId,
                                    @RequestParam int numRooms) {
        
        // Find the clinic
        Clinic clinic = clinicRepository.findById(clinicId)
            .orElseThrow(() -> new RuntimeException("Clinic not found with ID: " + clinicId));
        
        // Update the number of rooms
        clinic.setNumRooms(numRooms);
        
        //  Save the changes to database
        clinicRepository.save(clinic);
        
        //  Return success message
        return "Number of rooms updated to " + numRooms + " for clinic: " + clinic.getName();
    }
    
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
        
        // Getters for Spring to convert to JSON
        public String getClinicName() { return clinicName; }
        public String getLocation() { return location; }
        public String getOperatingHours() { return operatingHours; }
        public Integer getNumRooms() { return numRooms; }
        public List<Doctor> getDoctors() { return doctors; }
    }
}
