package aqms.web.controller;

import aqms.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/password")
@RequiredArgsConstructor
public class PasswordResetController {
    
    private final PasswordResetService resetService;

    @PostMapping("/request-reset")
    public void requestReset(@RequestParam String email) {
        resetService.sendResetEmail(email);
    }

    @PostMapping("/confirm-reset")
    public void confirmReset(@RequestParam String token, @RequestParam String newPassword) {
        resetService.resetPassword(token, newPassword);
    }
    
}
