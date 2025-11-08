package aqms.domain.dto;

import lombok.Data;

// This class defines what a "Doctor" looks like when
// sent as JSON to your front-end.
@Data
public class DoctorDto {
    
    // These are just examples.
    // Change these fields to match what your front-end needs.
    private String id;
    private String name;
    private String specialty;
}