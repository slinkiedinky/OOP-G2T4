package aqms.service;
import aqms.domain.model.UserAccount;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    // send da notification to da respective patient
    public void notifyPatient(UserAccount patient, String message) {
        // System.out.print(patient.getFullName());
        System.out.println("Notification Sent. Recipient is: " + patient.getUsername() + ": " + message + ".");
    }

}

