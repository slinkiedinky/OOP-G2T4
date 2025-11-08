// This code was modified from an AI-generated code using Gemini 2.5 Pro.

package aqms.domain;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;


/*
 * entity that represents an appointment in the database
 * this class maps to the "appointment" table
 * 
 * @NoArgsConstructor: generates a constructor without arguments
 * @AllArgsConstructor: generates a constructor with all arguments
 * @Entity: specifies that this class is a JPA entity
 * @Table(name = "appointment") - specifies the actual table name in the database
 * @Data - a lombok annotation to auto-generate getters, setters, toString, etc.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "appointments")
public class Appointment {
    
    // unique identifier for appointment, string used to store UUID
    @Id
    @Column(updatable = false, nullable = false)
    private String id;

    // id of the patient da appointment is for
    // linking to patient entity
    @Column(nullable = false)
    private String patientId;

    // id of the doctor da appointment is for
    @Column(nullable = false)
    private String doctorId;

    // da urrent status of da poointment
    // crucial for reporting
    // @Enumerated(EnumType.STRING) tells JPA to store da enum's name
    // as a string and not a number
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    // da scheduled start time of da appointment
    // used by da repository to find appointments for a specific day
    @Column(nullable = false)
    private LocalDateTime startTime;

    // da timestamp for when da patient checked in at da clinic
    private LocalDateTime checkInTime;

    // da timestamp for when da patient 
    // called in to see da doctor
    // end time for calculating "waiting time"
    private LocalDateTime consultationStartTime;

    // da time stamp for when da appointment was
    // mark ---- complete!
    private LocalDateTime completedTime;

    // auto set da timestamp when da appointment is first created
    // fulfilling da requirement from da user story
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAtTime;

    // auto update da timestamp each time da appointment is modified
    private LocalDateTime lastModifiedTime;


    // ### helper method to prepopulate id ##
    // ensuring a new appointment always gets an id
    public void ensureId() {
        // System.out.print(this.id);
        if (this.id == null) {
            this.id = java.util.UUID.randomUUID().toString();
        }
    }
}
