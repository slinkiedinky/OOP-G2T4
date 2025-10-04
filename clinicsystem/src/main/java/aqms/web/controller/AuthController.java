package aqms.web.controller;

import aqms.service.AuthService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService auth;

  public record LoginReq(@NotBlank String username, @NotBlank String password) {}
  public record TokenRes(String token) {}

  @PostMapping("/register-patient")
  public TokenRes register(@RequestBody LoginReq r) {
    String token = auth.registerPatient(r.username(), r.password(), null);
    return new TokenRes(token);
  }

  @PostMapping("/login")
  public TokenRes login(@RequestBody LoginReq r) {
    String token = auth.login(r.username(), r.password());
    return new TokenRes(token);
  }

  @GetMapping("/ping")
  public String ping() { return "OK"; }
}
