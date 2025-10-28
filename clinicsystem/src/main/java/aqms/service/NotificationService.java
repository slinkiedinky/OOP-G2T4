package aqms.service;
import org.springframework.stereotype.Service;
import aqms.domain.model.UserAccount;

@Service
public class NotificationService {
    public void notifyPatient(UserAccount patient, String message) {
        System.out.println("Notification Sent. Recipient is: " + patient.getUsername() + ": " + message + ".");
    }
}

