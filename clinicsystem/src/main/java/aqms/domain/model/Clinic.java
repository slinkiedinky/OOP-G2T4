package aqms.domain.model;

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
