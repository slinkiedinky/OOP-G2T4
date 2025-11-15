package aqms.web.controller;

import aqms.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/password")
@RequiredArgsConstructor
public class PasswordController {

  private final PasswordResetService resetService;

  record ResetRequest(String token, String newPassword) {}

  @PostMapping("/i-forgot")
  public void iforgotmypassword(@RequestBody EmailRequest req) {
    resetService.iforgotmypassword(req.email());
  }

  record EmailRequest(String email) {}

  @PostMapping("/confirm-reset")
  public void confirmReset(@RequestBody ResetRequest req) {
    resetService.resetPassword(req.token(), req.newPassword());

    record ResetRequest(String token, String newPassword) {}
  }
}
