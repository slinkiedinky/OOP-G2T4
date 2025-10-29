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
        message.setText("Hi " + user.getUsername() + ",\n\nClick the link below to reset your password:\n" + resetLink);
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
