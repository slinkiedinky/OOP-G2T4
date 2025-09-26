package aqms.web.controller;

import aqms.domain.enums.UserRole; import aqms.domain.model.UserAccount; import aqms.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*; import jakarta.validation.constraints.*;

@RestController @RequestMapping("/api/admin/users") @RequiredArgsConstructor
public class AdminUserController {
  private final UserAccountRepository users; private final PasswordEncoder enc;
  record CreateReq(@NotBlank String username, @NotBlank String password, @NotBlank String role) {}
  @PreAuthorize("hasRole('ADMIN')") @PostMapping
  public UserAccount create(@RequestBody CreateReq r){
    var u=new UserAccount(); u.setUsername(r.username()); u.setPasswordHash(enc.encode(r.password()));
    u.setRole(UserRole.valueOf(r.role().toUpperCase())); u.setEnabled(true); return users.save(u);
  }
}