package aqms.service;

import aqms.domain.model.Clinic;
import aqms.domain.model.Doctor;
import aqms.repository.ClinicRepository;
import aqms.repository.DoctorRepository;
import org.springframework.stereotype.Service;

@Service
/**
 * ClinicService
 *
 * Provides higher-level clinic operations used by controllers and other services, such as
 * retrieving clinic details and managing clinic doctor lists.
 */
public class ClinicService {

  private final ClinicRepository clinics;
  private final DoctorRepository doct;

  public ClinicService(ClinicRepository clinics, DoctorRepository doct) {
    this.clinics = clinics;
    this.doct = doct;
  }

  public Clinic getClinicDetails(Long id) {
    return clinics.findById(id).orElseThrow(() -> new RuntimeException("Clinic not found!"));
  }

  public void addAvailableDoctor(Long Clinic_id, Long Doctor_id) {
    Clinic clinic = getClinicDetails(Clinic_id);
    Doctor doctor =
        doct.findById(Doctor_id).orElseThrow(() -> new RuntimeException("Doctor not found!"));

    if (!clinic.getAvailableDoctors().contains(doctor)) {
      clinic.getAvailableDoctors().add(doctor);
    }
  }

  // public List<String> getDoctorSchedule(Long clinic_id, Long doctor_id) {
  //     Clinic clinic = getClinicDetails(clinic_id);
  //     Doctor doctor = doct.findById(doctor_id).orElseThrow(() -> new RuntimeException("Doctor not
  // found!"));

  //     return clinic.getDoctorSchedules().getOrDefault(doctor, List.of());
  // }

  // public void setDoctorSchedule(Long clinic_id, Long doctor_id, Long appt_id) {

  // }

  public void set_clinic_operatinghours(Long clinic_id, String hours) {
    Clinic clinic = getClinicDetails(clinic_id);
    clinic.setOperatingHours(hours);
    clinics.save(clinic);
  }

  public void removeAvailableDoctor(Long Clinic_id, Long Doctor_id) {
    Clinic clinic = getClinicDetails(Clinic_id);
    Doctor doctor =
        doct.findById(Doctor_id).orElseThrow(() -> new RuntimeException("Doctor not found!"));

    clinic.getAvailableDoctors().remove(doctor);
  }

  public void setApptIntervalSlots(Long Clinic_id, int Interval) {
    Clinic clinic = getClinicDetails(Clinic_id);
    clinic.setApptInterval(Interval);
  }
}
