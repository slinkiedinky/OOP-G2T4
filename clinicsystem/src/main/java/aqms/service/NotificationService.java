package aqms.service;

import aqms.domain.model.UserAccount;
import aqms.repository.ClinicRepository;
import aqms.repository.UserAccountRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class NotificationService {
    /**
     * NotificationService
     *
     * Sends email notifications for queue updates and other user-facing events.
     */
    private final JavaMailSender mailSender;
    private final UserAccountRepository userRepo;
    private final ClinicRepository clinicRepo;

    public void notifyPatient(UserAccount patient, String message) {
        System.out.println("Notification Sent. Recipient is: " + patient.getEmail() + ": " + message + ".");
    }

    @Transactional
    public void notifyPatientQueue(String email, Long clinicId, int queueNum, int numberAhead) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        var clinic = clinicRepo.findById(clinicId).
                orElseThrow(() -> new RuntimeException("Clinic not found"));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("QmeNow: Queue Position");
        message.setText("Hi " + user.getFullname() + ",\nThank you for checking in at " + clinic.getName() + ".\n\n" +
                        "Your current queue number is " + queueNum + ".\nThere are currently "+ numberAhead + " people ahead of you.\n\nPlease wait patiently, we will attend to you shortly.\nBest regards,\nQmeNow Team.");

        mailSender.send(message);
        System.out.println("Queue email sent to " + email + " (Queue #" + queueNum + ")"); 
    }

    @Transactional
    public void notifyFastTrackedPatient(String email, Long clinicId, int queueNumber, String reason) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var clinic = clinicRepo.findById(clinicId)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("QmeNow: You've Been Fast-Tracked at " + clinic.getName());
        message.setText(
            "Hi " + user.getFullname() + ",\n\n" +
            "You have been fast-tracked for your appointment at " + clinic.getName() + ".\n\n" +
            "Queue number: #" + queueNumber + "\n" +
            "Reason for fast-track: " + reason + "\n\n" +
            "Please stay nearby, you'll be called shortly.\n\n" +
            "Best regards,\nQmeNow Team"
        );

        mailSender.send(message);
        // System.out.println("Fast-track email sent to " + email);
    }

    @Transactional
    public void notifyNextInLine(String email, Long clinicId, int qNum) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        var clinic = clinicRepo.findById(clinicId)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("QmeNow: You're Next in Queue at " + clinic.getName() + "!");
        message.setText(
            "Hi " + user.getFullname() + ",\n\n" +
            "You are now next in line for your appointment at " + clinic.getName() + ".\n" +
            "Queue Number: #"+ qNum + "\n\n" +
            "Please proceed to the waiting area.\n\n" +
            "Thank you for your patience, \nQmeNow Team"
        );
    
        mailSender.send(message);
        // System.out.println("Next-in-line notification sent to " + email);
    }
}







