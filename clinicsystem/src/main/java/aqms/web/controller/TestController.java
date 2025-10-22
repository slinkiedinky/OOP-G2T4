package aqms.web.controller;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/encode")
    public Object encodePassword(@RequestParam String password) {
        return new Object() {
            public final String password = password;
            public final String encoded = passwordEncoder.encode(password);
        };
    }
}
