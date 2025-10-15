package aqms.domain.model;

import jakarta.persistence.*; import lombok.*; import java.util.List;
@Entity @Getter @Setter @NoArgsConstructor
public class Clinic {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  private String name; private String location; private String operatingHours; @OneToMany private List<Doctor>availableDoctors; private int apptInterval;
}

//removed numRooms
