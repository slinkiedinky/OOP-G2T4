package aqms.service;

import aqms.domain.enums.AppointmentStatus;
import aqms.domain.enums.UserRole;
import aqms.domain.model.*;
import aqms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
public class DataSeederService implements CommandLineRunner {
    private final ClinicRepository clinicRepo;
    private final DoctorRepository doctorRepo;
    private final DoctorScheduleRepository scheduleRepo;
    private final AppointmentSlotRepository slotRepo;
    private final UserAccountRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Create admin user
        var adminUser = new UserAccount();
        adminUser.setEmail("hy5411@gmail.com");
        adminUser.setPasswordHash(passwordEncoder.encode("12345"));
        adminUser.setRole(UserRole.ADMIN);
        userRepo.save(adminUser);

        // Create test patient user account
        var patientUser = new UserAccount();
        patientUser.setEmail("testpatient@hotmail.com");
        patientUser.setPasswordHash(passwordEncoder.encode("password"));
        patientUser.setRole(UserRole.PATIENT);
        userRepo.save(patientUser);

        // Create clinics
        var clinic1 = new Clinic();
        clinic1.setName("Main Clinic");
        clinic1.setLocation("Downtown");
        clinic1.setOperatingHours("9:00 AM - 5:00 PM");
        clinic1.setNumRooms(5);
        clinic1.setApptInterval(30);
        clinic1.setClinicType("GP");
        clinic1.setAddress("123 Main St");
        clinic1.setTelephoneNumber("555-0123");
        clinic1.setPcnNetwork("Network A");
        clinic1.setSpecialty("General Practice");
        clinicRepo.save(clinic1);

        var clinic2 = new Clinic();
        clinic2.setName("Specialty Clinic");
        clinic2.setLocation("Uptown");
        clinic2.setOperatingHours("8:00 AM - 6:00 PM");
        clinic2.setNumRooms(3);
        clinic2.setApptInterval(45);
        clinic2.setClinicType("Specialist");
        clinic2.setAddress("456 Oak Ave");
        clinic2.setTelephoneNumber("555-0456");
        clinic2.setPcnNetwork("Network B");
        clinic2.setSpecialty("Cardiology");
        clinicRepo.save(clinic2);

        // Create doctors
        var doctor1 = new Doctor();
        doctor1.setName("Dr. Smith");
        doctor1.setSpecialization("General Practice");
        doctor1.setClinic(clinic1);
        doctorRepo.save(doctor1);

        var doctor2 = new Doctor();
        doctor2.setName("Dr. Johnson");
        doctor2.setSpecialization("Cardiology");
        doctor2.setClinic(clinic2);
        doctorRepo.save(doctor2);

        // Create doctor schedules
        var now = LocalDateTime.now();
        var schedule1 = new DoctorSchedule();
        schedule1.setDoctor(doctor1);
        schedule1.setStartTime(now.plusDays(1).withHour(9).withMinute(0));
        schedule1.setEndTime(now.plusDays(1).withHour(17).withMinute(0));
        schedule1.setAvailable(true);
        scheduleRepo.save(schedule1);

        var schedule2 = new DoctorSchedule();
        schedule2.setDoctor(doctor2);
        schedule2.setStartTime(now.plusDays(2).withHour(8).withMinute(0));
        schedule2.setEndTime(now.plusDays(2).withHour(16).withMinute(0));
        schedule2.setAvailable(true);
        scheduleRepo.save(schedule2);

        // Create appointment slots
        var slot1 = new AppointmentSlot();
        slot1.setClinic(clinic1);
        slot1.setDoctor(doctor1);
        slot1.setStartTime(now.plusDays(1).withHour(9).withMinute(0));
        slot1.setEndTime(now.plusDays(1).withHour(9).withMinute(30));
        slot1.setStatus(AppointmentStatus.AVAILABLE);
        slotRepo.save(slot1);

        var slot2 = new AppointmentSlot();
        slot2.setClinic(clinic1);
        slot2.setDoctor(doctor1);
        slot2.setStartTime(now.plusDays(1).withHour(9).withMinute(30));
        slot2.setEndTime(now.plusDays(1).withHour(10).withMinute(0));
        slot2.setStatus(AppointmentStatus.AVAILABLE);
        slotRepo.save(slot2);

        System.out.println("✅ Test data seeded successfully!");
        System.out.println("📊 Created: 2 clinics, 2 doctors, 2 schedules, 2 appointment slots");
        System.out.println("👤 Admin user: hy5411 / 12345");
    }
}
