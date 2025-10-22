package aqms.service;
<<<<<<< HEAD
import org.springframework.stereotype.Service;
import aqms.domain.model.UserAccount;
=======
import aqms.domain.model.Patient;
import org.springframework.stereotype.Service;
>>>>>>> 1c4e39e (fix compile error issue)

@Service
public class NotificationService {
    public void notifyPatient(UserAccount patient, String message) {
        System.out.println("Notification Sent. Recipient is: " + patient.getUsername() + ": " + message + ".");
    }
}

