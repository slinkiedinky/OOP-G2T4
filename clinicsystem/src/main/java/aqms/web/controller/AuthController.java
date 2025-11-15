package aqms.web.controller;

import aqms.service.AuthService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
/**
 * AuthController
 *
 * Public authentication endpoints (register/login) that produce JWT tokens. Paths:
 * /api/auth/login, /api/auth/register-*
 */
public class AuthController {

  private final AuthService auth;

  public record LoginReq(@NotBlank String email, @NotBlank String password) {}

  public record TokenRes(String token) {}

  public record RegisterReq(
      @NotBlank String username, @NotBlank String email, @NotBlank String password) {}

  @PostMapping("/register-patient")
  public TokenRes register(@RequestBody RegisterReq r) {
    String token = auth.registerPatient(r.username(), r.email(), r.password(), null);
    return new TokenRes(token);
  }

  @PostMapping("/register-admin")
  public TokenRes registerAdmin(@RequestBody RegisterReq r) {
    String token = auth.registerAdmin(r.username(), r.email(), r.password(), null);
    return new TokenRes(token);
  }

  @PostMapping("/register-staff")
  public TokenRes registerStaff(@RequestBody RegisterReq r) {
    String token = auth.registerStaff(r.username(), r.email(), r.password(), null);
    return new TokenRes(token);
  }

  @PostMapping("/login")
  public TokenRes login(@RequestBody LoginReq r) {
    String token = auth.login(r.email(), r.password());
    return new TokenRes(token);
  }

  @GetMapping("/ping")
  public String ping() {
    return "OK";
  }
}
