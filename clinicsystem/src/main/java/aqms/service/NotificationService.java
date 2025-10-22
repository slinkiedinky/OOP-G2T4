package aqms.service;
import aqms.domain.model.Patient;
import org.springframework.stereotype.Service;

@Service
// NOTE: The NotificationService class is written by Ng Jin Han, Joshua.
public class NotificationService {
    // send da notification to da respective patient
    public void notifyPatient(Patient patient, String message) {
        // System.out.print(patient.getFullName());
        System.out.println("Notification Sent. Recipient is: " + patient.getFullName() + ": " + message + ".");
    }

}

