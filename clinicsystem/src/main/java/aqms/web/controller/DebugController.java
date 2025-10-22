package aqms.web.controller;

import aqms.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {
    private final UserAccountRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/users")
    public List<Object> getUsers() {
        return userRepo.findAll().stream()
                .map(user -> new Object() {
                    public final Long id = user.getId();
                    public final String username = user.getUsername();
                    public final String passwordHash = user.getPasswordHash();
                    public final String role = user.getRole().name();
                    public final boolean enabled = user.isEnabled();
                })
                .toList();
    }

    @GetMapping("/encode-password")
    public Object encodePassword(@RequestParam String password) {
        return new Object() {
            public final String password = password;
            public final String encoded = passwordEncoder.encode(password);
        };
    }
}