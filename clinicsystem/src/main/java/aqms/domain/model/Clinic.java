package aqms.domain.model;

<<<<<<< HEAD
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*; import lombok.*; import java.util.List;
@Entity @Getter @Setter @NoArgsConstructor
public class Clinic {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  private String name; private String location; private String operatingHours;
  private Integer numRooms; private Integer apptInterval; private String clinicType;
  private String address; private String telephoneNumber; private String pcnNetwork; private String specialty;
  @OneToMany(mappedBy = "clinic", fetch = FetchType.LAZY) @JsonIgnore private List<Doctor> availableDoctors;
}
=======
import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "clinic", indexes = {
    @Index(name = "idx_clinic_type", columnList = "clinicType"),
    @Index(name = "idx_clinic_location", columnList = "location")
})
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
>>>>>>> 784b44edf4ce2b3d87ad311e7e4304a410a10044
