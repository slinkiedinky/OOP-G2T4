package aqms.web.controller;

import aqms.service.PasswordResetService;
import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import aqms.service.NotificationService;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
/**
 * EmailController
 *
 * Lightweight endpoints that proxy notification and password-reset flows.
 * This controller delegates to NotificationService and PasswordResetService.
 */
public class EmailController {
    
    private final PasswordResetService resetService;
    private final NotificationService notificationService;

    @PostMapping("notification/notifypatientqueue")
    public void notifyPatientQueue(@RequestParam String email, @RequestParam Long clinicId, @RequestParam int queueNum, @RequestParam(required=false, defaultValue="0") int numberAhead) {
        notificationService.notifyPatientQueue(email, clinicId, queueNum, numberAhead);
    }

    @PostMapping("notification/notifynext")
    public void notifyNext(@RequestParam String email, @RequestParam Long clinicId, @RequestParam int queueNum) {
        notificationService.notifyNextInLine(email, clinicId,queueNum);
    }

    @PostMapping("notification/notifyfasttrack")
    public void notifyFastTrack(@RequestParam String email, @RequestParam Long clinicId, @RequestParam int queueNum, @RequestParam String reason) {
        notificationService.notifyFastTrackedPatient(email, clinicId, queueNum, reason);
    }

    @PostMapping("/password/request-reset")
    public void requestReset(@RequestParam String email) {
        resetService.sendResetEmail(email);
    }

    @PostMapping("/password/newaccount-reset")
    public void newAccountReset(@RequestParam String email) {
        resetService.sendNewAccountReset(email);
    }

    @PostMapping("/password/confirm-reset")
    public void confirmReset(@RequestParam String token, @RequestParam String newPassword) {
        resetService.resetPassword(token, newPassword);
    }
    
}
