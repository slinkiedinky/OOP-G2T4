package aqms.service;

import aqms.domain.model.UserAccount;
import aqms.repository.UserAccountRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    /**
     * PasswordResetService
     *
     * Handles password reset token generation, email delivery and performing
     * the password reset when a valid token is presented.
     */
    private final UserAccountRepository userRepo;
    private final JavaMailSender mailSender;
    private final PasswordEncoder encoder;
    private final Map<String, ResetToken> tokenStore = new HashMap<>();

    @Transactional
    public void sendResetEmail(String email) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, new ResetToken(user.getId(), LocalDateTime.now().plusMinutes(30)));

        String resetLink = "https://localhost:3000/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Password Reset Request");
        message.setText("Hi " + user.getFullname() + ",\nYou are requested to reset your password with the link below:\n" + resetLink + "\n\nThis link will expire in 30 minutes.\n\nBest Regards,\nClinic Management System");
        mailSender.send(message);
    }

    @Transactional
    public void sendNewAccountReset(String email) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, new ResetToken(user.getId(), LocalDateTime.now().plusWeeks(1)));

        String resetLink = "https://localhost:3000/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("New Account Password Reset");
        message.setText("Hi " + user.getFullname() + ", \nThank you for signing up with Clinic System. To access your account, do reset your new account's password by clicking the link below:\n" + resetLink + "\nThis link will expire in 1 week.\n\nBest Regards,\nClinic Management System");
        mailSender.send(message);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        var stored = tokenStore.get(token);
        if (stored == null || stored.expiry.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired token");
        }

        var user = userRepo.findById(stored.userId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(encoder.encode(newPassword));
        userRepo.save(user);
        tokenStore.remove(token);
    }

    record ResetToken(Long userId, LocalDateTime expiry) {}
}
