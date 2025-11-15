package aqms.domain.model;

import jakarta.persistence.*;
import java.util.List;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(
    name = "clinic",
    indexes = {
      @Index(name = "idx_clinic_type", columnList = "clinicType"),
      @Index(name = "idx_clinic_location", columnList = "location")
    })
/**
 * Clinic
 *
 * Represents a healthcare clinic. Stores metadata such as name, address, operating hours and
 * configured appointment interval. Used as the parent aggregation for doctors and appointment
 * slots.
 */
public class Clinic {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(name = "clinic_type", nullable = false)
  private String clinicType;

  @Column(nullable = false)
  private String address;

  @Column(name = "telephone_number")
  private String telephoneNumber;

  private String location;

  @Column(name = "operating_hours")
  private String operatingHours;

  @Column(name = "appt_interval")
  private Integer apptInterval = 30;

  @Column(name = "num_rooms")
  private Integer numRooms;

  @Column(name = "pcn_network")
  private String pcnNetwork;

  private String specialty;

  @OneToMany(mappedBy = "clinic")
  @com.fasterxml.jackson.annotation.JsonIgnore
  private List<Doctor> availableDoctors;
}
