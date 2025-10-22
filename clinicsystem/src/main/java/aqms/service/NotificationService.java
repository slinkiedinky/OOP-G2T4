package aqms.service;
import org.springframework.stereotype.Service;
import aqms.domain.model.Patient;

@Service
public class NotificationService {
    // send da notification to da respective patient
    public void notifyPatient(Patient patient, String message) {
        // System.out.print(patient.getFullName());
        System.out.println("Notification Sent. Recipient is: " + patient.getFullName() + ": " + message + ".");
    }

}

