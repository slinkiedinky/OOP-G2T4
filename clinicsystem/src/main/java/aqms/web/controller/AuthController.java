package aqms.web.controller;

import aqms.service.AuthService; import jakarta.validation.constraints.*; import org.springframework.web.bind.annotation.*; import lombok.RequiredArgsConstructor;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
  private final AuthService auth;
  record LoginReq(@NotBlank String username, @NotBlank String password) {}
  record TokenRes(String token) {}
  @PostMapping("/register-patient") public TokenRes register(@RequestBody LoginReq r){ return new TokenRes(auth.registerPatient(r.username(), r.password(), null)); }
  @PostMapping("/login") public TokenRes login(@RequestBody LoginReq r){ return new TokenRes(auth.login(r.username(), r.password())); }
}
