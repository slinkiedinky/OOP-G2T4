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
@RequestMapping("/api/admin/doctors")
@RequiredArgsConstructor
public class AdminDoctorController {
    
    // Replace with our DB
    private final DoctorRepository doctorRepository;
    private final ClinicRepository clinicRepository;
    
    /**
     * Add a doctor to a clinic
     * URL: POST /api/admin/doctors/{doctorId}/add-to-clinic?clinicId=1
     * Only ADMIN users can access this
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{doctorId}/add-to-clinic")
    public String addDoctorToClinic(@PathVariable Long doctorId,
                                  @RequestParam Long clinicId) {
        
        try {
            // Check if doctor ID is valid
            if (doctorId == null || doctorId <= 0) {
                return "Error: Invalid doctor ID. Please provide a valid doctor ID.";
            }
            
            //  Check if clinic ID is valid
            if (clinicId == null || clinicId <= 0) {
                return "Error: Invalid clinic ID. Please provide a valid clinic ID.";
            }
            
            // Find the doctor by ID
            Doctor doctor = null;
            if (doctorRepository.existsById(doctorId)) {
                doctor = doctorRepository.findById(doctorId).get();
            } else {
                return "Error: Doctor not found with ID: " + doctorId;
            }
            
            // Find the clinic by ID
            Clinic clinic = null;
            if (clinicRepository.existsById(clinicId)) {
                clinic = clinicRepository.findById(clinicId).get();
            } else {
                return "Error: Clinic not found with ID: " + clinicId;
            }
            
            // Check if doctor is already assigned to a clinic
            if (doctor.getClinic() != null) {
                if (doctor.getClinic().getId().equals(clinicId)) {
                    return "Doctor " + doctor.getName() + " is already assigned to clinic " + clinic.getName();
                } else {
                    return "Doctor " + doctor.getName() + " is already assigned to another clinic. Please remove them first.";
                }
            }
            
            // Link the doctor to the clinic
            doctor.setClinic(clinic);
            
            // Save the changes to database
            doctorRepository.save(doctor);
            
            // Return success message
            return "SUCCESS: Doctor " + doctor.getName() + " successfully added to clinic " + clinic.getName();
            
        } catch (Exception e) {
            // Handle any unexpected errors
            return "Error: Something went wrong while adding doctor to clinic. Error: " + e.getMessage();
        }
    }
    
    /**
     * Function 2: Remove a doctor from a clinic
     * URL: DELETE /api/admin/doctors/{doctorId}/remove-from-clinic?clinicId=1
     * Only ADMIN users can access this
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{doctorId}/remove-from-clinic")
    public String removeDoctorFromClinic(@PathVariable Long doctorId,
                                       @RequestParam Long clinicId) {
        
        try {
            // Check if doctor ID is valid
            if (doctorId == null || doctorId <= 0) {
                return "Error: Invalid doctor ID. Please provide a valid doctor ID.";
            }
            
            //  Check if clinic ID is valid
            if (clinicId == null || clinicId <= 0) {
                return "Error: Invalid clinic ID. Please provide a valid clinic ID.";
            }
            
            // Find the doctor by ID
            Doctor doctor = null;
            if (doctorRepository.existsById(doctorId)) {
                doctor = doctorRepository.findById(doctorId).get();
            } else {
                return "Error: Doctor not found with ID: " + doctorId;
            }
            
            // Check if doctor is assigned to any clinic
            if (doctor.getClinic() == null) {
                return "Doctor " + doctor.getName() + " is not assigned to any clinic.";
            }
            
            // Check if doctor belongs to the specified clinic
            if (!doctor.getClinic().getId().equals(clinicId)) {
                return "Error: Doctor " + doctor.getName() + " does not belong to clinic ID " + clinicId;
            }
            
            // Get clinic name before removing (for success message)
            String clinicName = doctor.getClinic().getName();
            
            //  Remove the clinic reference (set to null)
            doctor.setClinic(null);
            
            // Save the changes to database
            doctorRepository.save(doctor);
            
            // Return success message
            return "SUCCESS: Doctor " + doctor.getName() + " successfully removed from clinic " + clinicName;
            
        } catch (Exception e) {
            // Handle any unexpected errors
            return "Error: Something went wrong while removing doctor from clinic. Error: " + e.getMessage();
        }
    }
    
    /**
     * Function 3: Get all doctors in a specific clinic
     * URL: GET /api/admin/doctors/clinic/{clinicId}
     * Only ADMIN users can access this
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/clinic/{clinicId}")
    public Object getDoctorsInClinic(@PathVariable Long clinicId) {
        
        try {
            // Check if clinic ID is valid
            if (clinicId == null || clinicId <= 0) {
                return "Error: Invalid clinic ID. Please provide a valid clinic ID.";
            }
            
            // Check if clinic exists
            if (!clinicRepository.existsById(clinicId)) {
                return "Error: Clinic not found with ID: " + clinicId;
            }
            
            // Get all doctors in this clinic
            List<Doctor> doctors = doctorRepository.findByClinicId(clinicId);
            
            // Check if any doctors found
            if (doctors == null || doctors.isEmpty()) {
                return "No doctors found in clinic ID: " + clinicId;
            }
            
            // Return the list of doctors
            return doctors;
            
        } catch (Exception e) {
            // Handle any unexpected errors
            return "Error: Something went wrong while getting doctors from clinic. Error: " + e.getMessage();
        }
    }
    
    /**
     * Function 4: Get all doctors (from all clinics)
     * URL: GET /api/admin/doctors/all
     * Only ADMIN users can access this
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public Object getAllDoctors() {
        
        try {
            //  Get all doctors from database
            List<Doctor> allDoctors = doctorRepository.findAll();
            
            // Check if any doctors found
            if (allDoctors == null || allDoctors.isEmpty()) {
                return "No doctors found in the system.";
            }
            
            //  Return the list
            return allDoctors;
            
        } catch (Exception e) {
            //  Handle any unexpected errors
            return "Error: Something went wrong while getting all doctors. Error: " + e.getMessage();
        }
    }
}
